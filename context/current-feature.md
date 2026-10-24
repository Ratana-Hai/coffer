# Current Feature: Auth & Onboarding

## Status

In Progress

## Goals

- Wire Auth.js v5 with a magic-link (Email) provider, a Prisma adapter, and a JWT session; add `Account`/`Session`/`VerificationToken`/`LoginAttempt` models and a checked-in migration.
- Two-field sign-up (name + email, `novalidate`, app-owned per-field errors on submit) that creates the user, starts the session, and redirects to `/overview` (R2–R5).
- Onboarding welcome screen gated by R1 (no data AND no 2FA AND not onboarded); "Skip and use the defaults" marks onboarded and writes nothing else (R6).
- Sign-in never reveals whether an email is registered (R16); magic link logged to the server console in dev.
- `middleware.ts` gates the whole `(app)` group and redirects to `/sign-in?next=`; the session resolves before any ledger content paints (R14, R15).
- TOTP second factor: RFC 6238 with ±1 window (R11), server-side cooldown after 5 failures (R12), enrollment QR as inline SVG via our own encoder (R8), enrollment inactive until a code confirms (R9), disable requires a current code (R10).
- Encrypt authenticator secrets at rest with an env key; never expose a secret to a client component.
- "Lock now" ends the session and redirects to sign-in (R13).

## Notes

- Spec: `context/feature/01-auth-and-onboarding.md`, rules R1–R16.
- Credential: magic link (Email provider). No email provider is wired — the dev transport logs the sign-in URL to the server console.
- Session: JWT strategy (encrypted cookie, per AGENTS.md); the Prisma adapter persists magic-link `VerificationToken`s only.
- TOTP secret encrypted at rest (AES-GCM) with a key from `env`; QR encoder is hand-rolled (byte mode, EC level M, versions 1–10).
- TOTP enrollment/disable UI lands in Settings (feature 07); this feature ships the server actions and the `/verify` challenge.

## History

- Database (Neon Postgres + Prisma) — `feature/database-neon-prisma`.
