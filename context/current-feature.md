# Current Feature: Database (Neon Postgres + Prisma)

## Status

In Progress

## Goals

- Add the Neon + Prisma driver-adapter dependencies (`@prisma/adapter-neon`, `@neondatabase/serverless`) and make `src/server/db/index.ts` env-aware: Neon adapter over the pooled URL at runtime, plain classic client over `TEST_DATABASE_URL` in tests.
- Add `directUrl = env("DIRECT_URL")` to the Prisma datasource and generate the first migration, checked in under `prisma/migrations/`.
- Extend `src/lib/env.ts` with `DIRECT_URL` (required) and `SHADOW_DATABASE_URL` (optional) and update `.env.example`.
- Implement `prisma/seed.ts` with dev + E2E fixtures, including a KHR ledger (0 decimals, suffix symbol).
- Add `vitest.config.ts` with a Testcontainers `globalSetup` that runs `prisma migrate deploy` and exposes `TEST_DATABASE_URL`.
- Verify every repository filters on `userId`; money stays `numeric(14,2)`, calendar days normalize to `YYYY-MM-DD` at the repository boundary.

## Notes

- Spec: `context/feature/09-database.md`. Rules R1–R6.
- Connection split: runtime → Neon adapter over pooled `DATABASE_URL`; CLI (`migrate`) → `DIRECT_URL`; tests → plain client over `TEST_DATABASE_URL`.
- Neon project: `main` (prod) + `dev` branch; no per-PR preview branches. Never `db push` in prod — `migrate deploy` only.
- Offline-first: the first migration is generated with `prisma migrate diff` (no live Neon needed) and applied later via `migrate deploy`.
- Docker is required for integration tests (Testcontainers); not available in this environment — config is written, run is deferred.

## History
