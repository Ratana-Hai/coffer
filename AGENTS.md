# Coffer — Full-Stack Project Overview (Next.js + Tailwind + shadcn/ui)

Coffer is a personal finance app: a ledger, monthly budgets, amortizing loans
and savings goals, with a themeable UI and a preferences page that saves on
demand rather than on every keystroke.

This document is the architecture. The nine files in [`docs/specs/`](docs/specs/)
are the feature requirements. Together they are enough to build the product from
an empty directory.

---

## 1. Product scope

| Area | What it does |
|---|---|
| **Overview** | five glance figures, spending by category, income vs. expenses over six months, recent activity |
| **Transactions** | the ledger — income and expenses, categorized, newest first |
| **Budgets** | a monthly limit per category, measured against this month's spend |
| **Loans** | amortizing loans, a payment ledger that folds into a live balance, a full schedule |
| **Goals** | savings targets with progress |
| **Settings** | profile, display currency, theme, two-factor auth, data controls |

**Non-goals for v1.** Multi-user households, bank sync or open-banking imports,
investment tracking, tax reporting, multi-currency conversion, mobile apps.
Coffer is one person's ledger, entered by hand, and the architecture should not
pay for the features it does not have.

**The properties worth protecting**, because they are what make the app good and
they are easy to lose:

1. **One source of truth, rendered one way.** The UI is a function of stored
   state. There is no second copy of a figure kept in sync by hand.
2. **Money is exact.** Amortization schedules close to zero. Nothing important
   is computed in two places.
3. **Legibility is measured, not assumed.** Contrast ratios are asserted, not
   eyeballed.
4. **Preferences save when you say so.** Settings drafts; everything else is
   immediate.

---

## 2. Stack

| Layer | Choice | Why this one |
|---|---|---|
| Framework | **Next.js 15+, App Router, TypeScript strict** | Server Components remove the client/server data round-trip; Server Actions replace a hand-written REST layer for form work |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`) | v4's config lives in CSS, so design tokens are the source of truth for both the stylesheet and the utility classes — one place, not two |
| Components | **shadcn/ui** (Radix + CVA) | copied into the repo, not a dependency — the drawer/sheet geometry needs hand-tuning, and a black-box component library makes that a fight |
| DB | **Postgres + Prisma ORM** | one `schema.prisma` is the source of truth — it generates the typed client *and* the migration SQL, so the types cannot drift from the tables; `Decimal` for money |
| Auth | **Auth.js v5** (`next-auth@5`) | session in an encrypted cookie, read the same way in RSC, Route Handlers and middleware |
| Validation | **Zod** — one schema per entity, shared | the client form and the Server Action validate with the *same* object; no drift |
| Forms | **react-hook-form** + `@hookform/resolvers/zod` | `formState.dirtyFields` is exactly the draft model Settings needs, for free |
| Server state | **TanStack Query** — only where it earns it | the infinite transaction list and optimistic toggles. Everything else is RSC + `revalidatePath` |
| Charts | **Recharts** via the shadcn/ui chart wrapper | reads its palette from CSS variables, so light/dark and the base tones work with no JS palette switch |
| Tests | **Vitest** (unit, integration) + **Playwright** (E2E) | |
| Tooling | ESLint flat config, Prettier, TypeScript strict, Husky + lint-staged | |

---

## 3. Directory structure

```
coffer/
├── src/
│   ├── app/                          # routing ONLY — thin files
│   │   ├── (marketing)/              # route group: no auth, marketing shell
│   │   │   ├── page.tsx              # welcome / landing
│   │   │   └── layout.tsx
│   │   ├── (auth)/
│   │   │   ├── sign-in/page.tsx
│   │   │   ├── sign-up/page.tsx
│   │   │   └── verify/page.tsx       # second-factor challenge
│   │   ├── (app)/                    # everything behind auth
│   │   │   ├── layout.tsx            # navbar + stat grid + tab bar + <Toaster/>
│   │   │   ├── overview/page.tsx
│   │   │   ├── transactions/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── loading.tsx       # skeleton, streamed
│   │   │   │   └── error.tsx
│   │   │   ├── budgets/page.tsx
│   │   │   ├── loans/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [loanId]/page.tsx # amortization schedule
│   │   │   ├── goals/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── export/route.ts       # CSV / JSON download — needs a real Response
│   │   │   └── webhooks/.../route.ts
│   │   ├── layout.tsx                # <html>, fonts, ThemeProvider
│   │   ├── globals.css               # @import "tailwindcss" + @theme tokens
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui output — generated, rarely hand-edited
│   │   │   ├── button.tsx  dialog.tsx  drawer.tsx  sheet.tsx  form.tsx
│   │   │   ├── input.tsx   select.tsx  table.tsx   tabs.tsx   sonner.tsx
│   │   │   └── ...
│   │   ├── layout/                   # app chrome: navbar, tab bar, account menu
│   │   ├── shared/                   # cross-feature: Money, EmptyState, ResponsivePanel
│   │   └── providers.tsx             # Theme + Query + Session providers, one 'use client'
│   │
│   ├── features/                     # ← the important one. Vertical slices.
│   │   ├── transactions/
│   │   │   ├── components/           # TransactionRow, AddTransactionPanel, Filters
│   │   │   ├── actions.ts            # 'use server' — the only mutation entry point
│   │   │   ├── queries.ts            # 'server-only' — read functions for RSC
│   │   │   ├── schema.ts             # Zod, shared client + server
│   │   │   └── types.ts
│   │   ├── budgets/
│   │   ├── loans/
│   │   ├── goals/
│   │   ├── overview/
│   │   ├── settings/
│   │   └── auth/
│   │
│   ├── server/                       # server-only, never imported by a client component
│   │   ├── db/
│   │   │   └── index.ts              # PrismaClient singleton (hot-reload safe)
│   │   ├── repositories/             # Prisma queries live here and nowhere else
│   │   ├── services/                 # business rules, transactions, cross-entity writes
│   │   └── auth/
│   │       ├── config.ts             # Auth.js providers, callbacks
│   │       ├── session.ts            # requireUser(), getSession()
│   │       └── totp.ts               # RFC 6238 second factor
│   │
│   ├── lib/
│   │   ├── finance/                  # pure, no I/O — the domain core
│   │   │   ├── amortization.ts       # scheduledPayment, loanStatus, amortSchedule
│   │   │   ├── budget.ts             # status bands
│   │   │   ├── money.ts              # minor units, rounding, compact form
│   │   │   └── currency.ts           # code, symbol, decimals, position
│   │   ├── theme.ts                  # accent → derived tokens, WCAG-measured
│   │   ├── utils.ts                  # cn()
│   │   ├── errors.ts                 # AppError, ValidationError, NotFoundError
│   │   ├── action-state.ts           # the ActionState type
│   │   └── env.ts                    # Zod-parsed process.env, fails at boot
│   │
│   ├── hooks/                        # use-media-query, use-draft, use-mounted
│   ├── types/                        # ambient + shared types
│   └── middleware.ts                 # session gate on (app) routes
│
├── prisma/
│   ├── schema.prisma                 # THE schema — models, enums, indexes
│   ├── migrations/                   # generated SQL, checked in and reviewed
│   └── seed.ts                       # dev + test fixtures, wired via package.json
├── docs/specs/                       # the nine feature specs
├── tests/
│   ├── e2e/                          # Playwright
│   ├── integration/                  # Vitest + Testcontainers Postgres
│   └── unit/                         # Vitest, no I/O
├── public/
├── components.json                   # shadcn/ui config
├── .env.example
└── PROJECT_OVERVIEW.md
```

### Why `features/` and not `components/` + `lib/`

A folder per feature means adding "recurring transactions" touches one
directory, and deleting a feature is `rm -rf`. The alternative — all components
in one folder, all hooks in another — spreads a single change across four
directories and makes dead code invisible. Group by what the code is *for*, not
by what it *is*.

### Dependency direction — enforce it

```
app/  →  features/  →  server/services  →  server/repositories  →  server/db
  ↓         ↓
components/ lib/     (leaf; import nothing above them)
```

Rules that hold everywhere:

- `app/**` files are thin: read params, call a query, render a feature component.
- **Only** `server/repositories/**` touches `prisma`. Services orchestrate; they
  never build queries, and no other layer imports the client.
- `lib/**` is pure and dependency-free — that is what makes the finance module
  testable without a database.
- Nothing in `server/**` is importable from a `'use client'` file. Put
  `import 'server-only'` at the top of every query and repository file so the
  bundler turns a mistake into a build error rather than a leaked connection
  string.

---

## 4. The full-stack flow

### Read path (default — no client fetching)

```
URL  →  middleware (session cookie)  →  app/(app)/transactions/page.tsx  [RSC]
     →  features/transactions/queries.ts   getTransactions({ userId, filters })
     →  server/repositories/transactions.ts   prisma.transaction.findMany
     →  Postgres
     →  RSC renders TransactionRow[]  →  HTML streamed  →  browser
```

No `useEffect`, no loading spinner in component code, no API route. `loading.tsx`
supplies the skeleton while the segment streams.

### Write path (Server Action)

```
<form action={createTransaction}>          client, progressively enhanced
   →  features/transactions/actions.ts     'use server'
   →  requireUser()                        redirect if absent
   →  transactionSchema.parse(formData)    Zod — the same schema the form used
   →  services/transactions.create()       business rules, DB transaction
   →  repositories/transactions.insert()   SQL
   →  revalidatePath('/transactions')      RSC re-renders from the DB
   →  return { ok } | { fieldErrors }      rendered by useActionState
```

The database is the single source of truth and `revalidatePath` is the render
trigger. No client-side store mirrors it, so there is nothing to keep in sync.

### Which mechanism for which job

| Need | Use |
|---|---|
| Page data | RSC + `queries.ts` |
| Form submit, delete, toggle | Server Action |
| Infinite scroll, polling, optimistic UI | TanStack Query against a Route Handler |
| File download, third-party webhook, mobile client | Route Handler in `app/api/` |

Do not build REST routes for things a Server Action already does — that is two
code paths and two validation sites for one behavior.

---

## 5. Data model

Every table carries `userId` and every query filters on it. That is the whole
multi-tenancy story, and it is worth keeping that simple.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TransactionType {
  income
  expense
}

model User {
  id             String          @id @default(uuid()) @db.Uuid
  name           String
  email          String          @unique
  onboarded      Boolean         @default(false)
  createdAt      DateTime        @default(now()) @map("created_at") @db.Timestamptz(3)
  transactions   Transaction[]
  budgets        Budget[]
  goals          Goal[]
  loans          Loan[]
  preferences    Preference?
  authenticators Authenticator[]

  @@map("users")
}

model Transaction {
  id       String          @id @default(uuid()) @db.Uuid
  userId   String          @map("user_id") @db.Uuid
  date     DateTime        @db.Date
  desc     String
  amount   Decimal         @db.Decimal(14, 2)   // never Float
  type     TransactionType
  category String?
  loanId   String?         @map("loan_id") @db.Uuid

  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  loan Loan? @relation(fields: [loanId], references: [id], onDelete: SetNull)

  @@index([userId, date(sort: Desc)], map: "tx_user_date_idx")
  @@map("transactions")
}

// Budget(userId, categoryKey, monthlyLimit)   @@unique([userId, categoryKey])
// Goal(userId, name, target, saved)
// Loan(userId, name, principal, rate, termMonths, startDate)
// Preference(userId @unique, currencyCode, customSymbol, decimals, position,
//            themeAccent, themeBase, themeMode)
// Authenticator(userId, secret, digits, period, confirmedAt)
```

The schema file is the only place a table is described. `prisma migrate dev`
writes the SQL into `prisma/migrations/` and regenerates the client in the same
step, so a model change the code has not caught up with is a type error rather
than a runtime surprise.

Three rules worth stating outright:

1. **Money is `Decimal`, never `Float`.** Prisma returns a `Decimal` object, not
   a JS number — convert it to minor units at the repository boundary with the
   fixed-point helper in `lib/finance/money.ts`, and never let a raw
   `.toNumber()` reach the domain. Floating-point cents are the classic way an
   amortization schedule stops closing to zero.
2. **Dates are `@db.Date` when they are calendar days** (a transaction date) and
   `@db.Timestamptz` when they are instants (`createdAt`). Prisma surfaces both
   as a JS `Date`, so the repository normalizes a calendar day to a `YYYY-MM-DD`
   string on the way out. Mixing the two produces off-by-one-day bugs across
   timezones.
3. **Referential actions live in the schema.** `onDelete: Cascade` on a user's
   transactions and `SetNull` on `loanId` are emitted as real foreign-key
   constraints, so they hold even when a write arrives from a migration or a
   psql session rather than from the app.

Loan payments are **not** a separate table. A payment is a transaction with
`loanId` set — one ledger, so a payment appears in the transaction list, the
expense total and the trend chart with no extra wiring.

---

## 6. Code patterns

### Env — fail at boot, not at 3am

```ts
// src/lib/env.ts
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET:  z.string().min(32),
  NODE_ENV:     z.enum(['development', 'test', 'production']),
})

export const env = schema.parse(process.env)   // throws during `next build` if wrong
```

### Prisma client — one instance, even in dev

```ts
// src/server/db/index.ts
import 'server-only'
import { PrismaClient } from '@prisma/client'
import { env } from '@/lib/env'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  })

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

Next.js re-evaluates modules on every hot reload. Without the global, each save
opens a fresh connection pool until Postgres starts refusing connections — and
it only bites after twenty minutes of editing, which is the worst time to work
out why.

### Session guard

```ts
// src/server/auth/session.ts
import 'server-only'
import { redirect } from 'next/navigation'
import { auth } from './config'

export async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  return session.user
}
```

### Query (read)

```ts
// src/features/transactions/queries.ts
import 'server-only'
import { cache } from 'react'
import { requireUser } from '@/server/auth/session'
import * as repo from '@/server/repositories/transactions'

export const getTransactions = cache(async (filters: TransactionFilters) => {
  const user = await requireUser()
  return repo.findMany(user.id, filters)     // userId is never client-supplied
})                                           // repo maps Decimal → minor units
```

`cache()` dedupes the call when three components on the same page ask for it.

### Server Action (write)

```ts
// src/features/transactions/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/server/auth/session'
import { transactionSchema } from './schema'
import * as service from '@/server/services/transactions'

export async function createTransaction(_prev: ActionState, formData: FormData) {
  const user = await requireUser()

  const parsed = transactionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await service.create(user.id, parsed.data)
  revalidatePath('/transactions')
  revalidatePath('/overview')                // the stat tiles read this
  return { ok: true }
}
```

Every action does the same four things in the same order: **authenticate,
validate, delegate, revalidate.** If an action is doing arithmetic, that
arithmetic belongs in `lib/finance/`.

### Shared schema — one definition, both sides

```ts
// src/features/transactions/schema.ts
export const transactionSchema = z.object({
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
  desc:     z.string().trim().min(1, 'Describe the transaction').max(120),
  amount:   z.coerce.number().gt(0, 'Amount must be more than zero'),
  type:     z.enum(['income', 'expense']),
  category: z.string().optional(),
})
export type TransactionInput = z.infer<typeof transactionSchema>
```

The client form resolves against this; the action parses against this. There is
no third place where the rules could disagree.

---

## 7. UI layer

### Theming

Tailwind v4 reads its config from CSS, so the design tokens are declared once
and consumed by both the stylesheet and the utility classes:

```css
/* src/app/globals.css */
@import "tailwindcss";

:root {                                   /* dark values as the default paint */
  --background: oklch(0.16 0.01 260);
  --foreground: oklch(0.97 0 0);
  --accent: oklch(0.68 0.15 250);
  --accent-ink: ...;   /* text ON the accent — chosen by measured contrast */
  --text-muted: ...;   /* clears 4.5:1 against every base tone */
}

@theme inline {                           /* expose tokens as Tailwind utilities */
  --color-background: var(--background);
  --color-accent: var(--accent);
}
```

Three independent theme axes:

- **mode** — `system | light | dark`, via `next-themes` (class strategy,
  `suppressHydrationWarning` on `<html>`). On `system`, a `matchMedia` listener
  tracks the OS live.
- **base** — `cool | neutral | contrast`, a `data-base` attribute on `<html>`
  with one token block each, in both light and dark.
- **accent** — one hex, from which `--accent-strong`, `--accent-deep`,
  `--accent-soft`, `--accent-line`, `--accent-ink` and `--accent-text` are
  derived in `lib/theme.ts`.

`--accent-ink` and `--accent-text` are picked by **measuring** WCAG contrast
against the candidates, not by testing luminance against a threshold. The
threshold shortcut is what makes mid-tone accents illegible, and it is a
tempting simplification — so it gets a comment in the source and a unit test.

### The responsive overlay panel

One mechanism, two shapes: a right-hand **drawer** above 880px, a bottom
**sheet** at or below it. shadcn/ui ships both; pick with a media-query hook and
expose one wrapper so feature code never branches:

```tsx
export function ResponsivePanel(props: PanelProps) {
  const isDesktop = useMediaQuery('(min-width: 881px)')
  return isDesktop ? <Sheet {...props} /> : <Drawer {...props} />
}
```

Both shapes share the same internal layout — **head / scrolling body / pinned
footer** — so the submit button stays put however long the form is. Two CSS
hazards are documented as rules in [spec 08](docs/specs/08-app-shell.md), because
both fail silently: `backdrop-filter` making an element the containing block for
`position: fixed` descendants, and responsive blocks needing to stay last in
source order to win on equal specificity.

### Server vs client components

Default to Server. Add `'use client'` only for event handlers, `useState`, Radix
primitives, `next-themes`, and charts. Push the boundary as far down the tree as
it will go — a client `<AddTransactionPanel>` inside a server
`<TransactionsPage>`, not the reverse.

### Settings drafts; everything else is immediate

Nothing on the Settings page writes until **Save changes**. With react-hook-form
that is nearly free: `formState.dirtyFields` drives the sticky save bar and its
"Unsaved name, theme changes" copy, Discard is `reset()`, and navigating away is
guarded. Two controls stay immediate by design — the account menu's currency
quick-switch, and **Clear all data**, which is an action rather than a
preference and carries its own two-tap confirm.

---

## 8. Testing

| Level | Tool | What it covers |
|---|---|---|
| Unit | Vitest | `lib/finance/**` — amortization against known values, schedules closing to zero, budget band boundaries, contrast derivation |
| Integration | Vitest + Testcontainers Postgres | services and repositories against a real database — `prisma migrate deploy` against the container in `globalSetup`, so the tests run the same SQL production will; `userId` scoping in particular |
| E2E | Playwright | each feature's acceptance criteria, seeded per worker |
| A11y | `@axe-core/playwright` | keeps the contrast requirements honest |

**Seed per worker, never share.** Each Playwright worker gets its own database
state (truncate + insert in `beforeAll`) rather than a shared fixture mutated by
whichever test ran last. Shared mutable state between a navigation and an
assertion is the main source of flake in a suite like this.

**Assert specifics, not screenshots.** Exact contrast ratios, computed tokens
and pixel geometry catch the bugs that look fine in an image: a sheet 20px off
the bottom edge, a 3.1:1 label, a bar anchored to the wrong containing block. A
visual diff passes all three.

---

## 9. Delivery phases

| Phase | Ships | Done when |
|---|---|---|
| **0 — Scaffold** | `create-next-app`, Tailwind v4, `shadcn init`, ESLint/Prettier, `lib/env.ts`, folder skeleton | the build passes on an empty app |
| **1 — Domain** | `lib/finance/**` — money, amortization, budget bands, currency | unit suite green, including 0% loans and over/underpayments |
| **2 — Data** | `schema.prisma`, the first migration, generated client, repositories, seed script | integration tests green against Testcontainers; every repo filters on `userId` |
| **3 — Auth** | Auth.js, `middleware.ts`, sign-up, second factor | [spec 01](docs/specs/01-auth-and-onboarding.md) criteria met |
| **4 — Shell + read UI** | navbar, stat grid, tab bar, all five views as RSC | [specs 02, 08](docs/specs/) criteria met; 320px holds |
| **5 — Write UI** | Server Actions, responsive add-panels, validation | [specs 03, 05, 06](docs/specs/) criteria met |
| **6 — Budgets + Settings** | budget rows and bands, the draft page, theme axes | [specs 04, 07](docs/specs/) criteria met |
| **7 — Harden** | error boundaries, rate limits on actions, export, CI, observability | full suite green in CI |

Phases 1 and 2 are the ones worth not rushing. Everything above them is
replaceable UI; a money bug in `lib/finance/` or a missing `userId` filter in a
repository is not.

---

## 10. Conventions checklist

- [ ] `import 'server-only'` at the top of every file under `server/` and every `queries.ts`
- [ ] `userId` comes from the session, never from a form field or URL param
- [ ] Every Server Action: authenticate → validate → delegate → revalidate
- [ ] Money is `Decimal` in the DB and fixed-point in code; no float arithmetic on cents
- [ ] One Zod schema per entity, imported by both the form and the action
- [ ] `prisma` imported only by `server/repositories/`
- [ ] `lib/` imports nothing from `app/`, `features/` or `server/`
- [ ] `'use client'` sits as low in the tree as it will go
- [ ] Color is a CSS variable, never a hex literal in a component
- [ ] Every mutating route has an `error.tsx`; every slow one has a `loading.tsx`
- [ ] Migrations are checked in and reviewed like code; `prisma migrate deploy` in CI and on deploy, never `db push`
- [ ] `prisma generate` runs on install and in CI; the generated client is not committed

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
