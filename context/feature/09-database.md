# 09 — Database (Neon Postgres + Prisma)

## Purpose

Stand up the data layer: Neon Postgres, Prisma, the first migration, the seed,
and the env-aware client singleton. This is Phase 2 in the delivery plan, but
with Neon (serverless Postgres) instead of a plain localhost Postgres — which
changes how the client connects, not what the schema stores.

Everything downstream reads from this: repositories filter on `userId`, services
write across entities in one transaction, and the UI renders stored state. Get
the money/date rules right here and the features on top stay honest.

---

## Components & dependencies

| Dependency | Why |
|---|---|
| `@prisma/client`, `prisma` (already pinned, 6.19.3) | typed client + CLI; driver adapters are GA since 6.16, so no `previewFeatures` flag |
| `@prisma/adapter-neon` | Neon driver adapter for the runtime client |
| `@neondatabase/serverless` | peer of the adapter; Neon's HTTP/WebSocket pooling driver |

Install: `npm i @prisma/adapter-neon @neondatabase/serverless`.

Tests use the **plain classic client** (no adapter) against a local Postgres
container — the Neon adapter speaks Neon's HTTP/WS protocol, which a stock
Postgres container does not understand.

---

## Environment & secrets

```bash
# .env (gitignored) — Neon connection strings
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/coffer?sslmode=require"  # pooled
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/coffer?sslmode=require"          # direct
SHADOW_DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/shadow?sslmode=require" # shadow, for migrate dev
AUTH_SECRET="..."   # phase 3
```

| Var | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | runtime client (Neon adapter) | the **pooled** connection; safe for serverless fan-out |
| `DIRECT_URL` | `prisma migrate dev` / `db push` | the **direct** connection; PgBouncer transaction pooling cannot run migrations |
| `SHADOW_DATABASE_URL` | `prisma migrate dev` only | a throwaway DB Neon diffing uses to generate migrations |
| `AUTH_SECRET` | Auth.js (phase 3) | already validated |

`src/lib/env.ts` gains `DIRECT_URL` (required) and `SHADOW_DATABASE_URL`
(optional, dev only), keeping the fail-at-boot behavior:

```ts
const envSchema = z.object({
  DATABASE_URL:        z.string().url(),
  DIRECT_URL:          z.string().url(),
  SHADOW_DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET:         z.string().min(32),
  NODE_ENV:            z.enum(["development", "test", "production"]),
});
```

`COFFER_DEV_PREVIEW=1` remains a dev-only escape hatch that renders the shell
with a stub session and empty data, untouched by this spec. Real runtime
(`NODE_ENV=production`) fails at boot without `DATABASE_URL` and `DIRECT_URL`.

---

## Prisma schema & generator

The model (users, transactions, budgets, goals, loans, preferences,
authenticators) is already written and is out of scope here. This spec changes
the datasource only:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

The client is regenerated with `prisma generate` (on install via `postinstall`,
and in CI); the generated client is never committed.

---

## Client construction

The singleton in `src/server/db/index.ts` stays hot-reload safe and becomes
environment-aware — the one place in the app that knows *which* driver to use:

```ts
import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  if (process.env.NODE_ENV === "test") {
    return new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  }
  const { PrismaNeon } = require("@prisma/adapter-neon");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Rules that hold:

- **Runtime** (serverless/Vercel) uses the Neon adapter over the pooled URL.
- **Test** (`NODE_ENV=test`) uses the plain classic client against
  `TEST_DATABASE_URL` (a Testcontainers Postgres URL). No Neon adapter, no extra
  `@prisma/adapter-pg` dependency.
- `prisma` is still imported **only** by `server/repositories/**`.

---

## Migration workflow

| Command | When | Notes |
|---|---|---|
| `npm run db:migrate` (`prisma migrate dev`) | local / dev branch | needs `DIRECT_URL` + `SHADOW_DATABASE_URL` |
| `npm run db:deploy` (`prisma migrate deploy`) | CI + deploy | idempotent; the only migration path in prod |
| `npm run db:generate` (`prisma generate`) | install + CI | |

- `prisma migrate dev` writes `prisma/migrations/<timestamp>_<name>/migration.sql`,
  checked in and reviewed like code.
- Deploy always runs `prisma migrate deploy` — **never** `db push` against a real
  database.
- One Neon project with a `main` branch (production) and a `dev` branch
  (development). Preview-branch-per-PR automation is out of scope.

---

## Seed

`prisma/seed.ts` (run via `tsx`, `npm run db:seed`) provides:

- Dev fixtures for a first-run ledger.
- Test fixtures for E2E — **seeded per worker**, never a shared mutable fixture
  (truncate + insert in `beforeAll`).

Fixtures must include a **KHR ledger** (0 decimals, suffix symbol) so the
money/currency rules are exercised end to end.

---

## Testing

| Level | Target | Detail |
|---|---|---|
| Unit | `lib/finance/**` | no I/O, unchanged |
| Integration | Testcontainers Postgres | `prisma migrate deploy` in `globalSetup`, so tests run production SQL |
| E2E | seeded DB per worker | Playwright, per-worker state |

`vitest.config.ts` (currently absent) is introduced here with `globalSetup` that
starts a Postgres container, runs `prisma migrate deploy` against it, and exposes
the URL as `TEST_DATABASE_URL`. Integration tests import repositories with
`NODE_ENV=test` so the singleton uses the plain client.

---

## Rules

- **R1.** Money is `numeric(14,2)` in the DB and integer minor units in
  `lib/finance/`. Prisma `Decimal` is converted to minor units at the repository
  boundary with `lib/finance/money.ts`; a raw `.toNumber()` never reaches the
  domain. Never `Float`.
- **R2.** Calendar days are `@db.Date` and normalize to a `YYYY-MM-DD` string on
  the way out of the repository; instants are `@db.Timestamptz`. Mixing the two
  is the off-by-one-day bug class.
- **R3.** Only `server/repositories/**` imports `prisma`. Every repository
  function takes `userId` as its first argument and filters on it. A repository
  function without a `userId` parameter is a bug.
- **R4.** Referential actions (`onDelete: Cascade`, `SetNull`) live in the
  schema and nowhere else, so they hold for any write path.
- **R5.** Migrations are reviewed like code. `prisma migrate deploy` in CI and on
  deploy; never `db push`. `prisma generate` on install and in CI.
- **R6.** The runtime client uses the Neon adapter over `DATABASE_URL` (pooled);
  the CLI uses `DIRECT_URL` (direct); tests use the plain client over
  `TEST_DATABASE_URL`. These three never mix.

---

## States

| State | Behavior |
|---|---|
| Missing `DATABASE_URL`/`DIRECT_URL` at boot | `env.ts` throws during build/start — fail at boot, not 3am |
| `prisma migrate dev` without shadow DB | CLI errors; set `SHADOW_DATABASE_URL` |
| Serverless fan-out without adapter | connection-pool exhaustion — caught by R6 |
| Testcontainers without Docker | `globalSetup` fails fast with a clear "Docker required" message |
| Neon branch out of sync | `migrate deploy` applies pending migrations idempotently; no data loss |

## Acceptance criteria

- [ ] `prisma migrate dev` generates the first migration against the Neon dev
      branch, and `prisma migrate deploy` applies it cleanly to a fresh branch
- [ ] `prisma migrate deploy` is idempotent — running twice applies nothing twice
- [ ] The runtime client connects to Neon over the pooled URL; the app builds and
      boots with `DATABASE_URL` + `DIRECT_URL` set
- [ ] `src/lib/env.ts` validates the new variables and still fails at boot without
      them (production)
- [ ] Integration tests pass against Testcontainers Postgres with the plain
      client, running the same migrations production will
- [ ] Every repository function takes `userId` first and filters on it (grep is
      a test here)
- [ ] The seed produces a KHR ledger fixture (0 decimals, suffix symbol)
- [ ] `prisma generate` runs on install; the generated client is gitignored/not
      committed

## Out of scope

Bank sync and open-banking imports, multi-tenant households, multi-currency
conversion, database-per-tenant, Neon preview-branch-per-PR automation, PostGIS
or other extensions. Neon branch automation is the likely later addition; the
`dev`/`main` two-branch split is deliberate and sufficient for v1.
