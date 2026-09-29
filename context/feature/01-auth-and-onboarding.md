# 01 — Auth & Onboarding

## Purpose

Establish `userId`. Everything else in the product filters on it, so this ships
before any other feature is safe to build multi-tenant.

It covers three things: getting a new person into their ledger with the least
possible friction, signing an existing one back in, and an optional second
factor for people who want their finances behind more than a session cookie.

---

## Routes & files

```
src/app/(marketing)/page.tsx           welcome / landing
src/app/(auth)/sign-up/page.tsx        the two-field form
src/app/(auth)/sign-in/page.tsx
src/app/(auth)/verify/page.tsx         second-factor challenge
src/app/api/auth/[...nextauth]/route.ts
src/middleware.ts                      gates the (app) group
src/server/auth/config.ts              Auth.js providers + callbacks
src/server/auth/session.ts             requireUser(), getSession()
src/server/auth/totp.ts                RFC 6238
src/features/auth/{actions,schema}.ts
```

## Data

```ts
users          (id, name, email unique, onboarded, createdAt)
accounts       // Auth.js
sessions       // Auth.js
authenticators (id, userId, secret, digits, period, confirmedAt, createdAt)
loginAttempts  (id, identifier, ip, at)     -- for the cooldown, R12
```

`authenticators.secret` is encrypted at rest with a key from `env`. It is never
returned to a client component — only the enrollment `otpauth://` URI is, and
only once, at enrollment time.

## Validation

```ts
export const signUpSchema = z.object({
  name:  z.string().trim().min(1, 'Enter a username').max(40),
  email: z.string().trim().email('Enter a valid email address').max(80),
})

export const totpCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
})
```

## Server API

```ts
// features/auth/actions.ts
signUp(prev, formData): ActionState          // R2–R5
skipOnboarding(): ActionState                // R6
beginTotpEnrollment(): { uri, qrSvg }         // R8
confirmTotpEnrollment(prev, formData)         // R9
disableTotp(prev, formData)                  // R10 — requires a current code
verifyTotp(prev, formData)                   // R11, R12
signOut(): never                             // R13
```

## UI

| Element | shadcn/ui |
|---|---|
| Sign-up / sign-in card | `card`, `form`, `input`, `button` |
| Code entry | `input-otp` |
| Enrollment QR | inline `<svg>`, rendered server-side — see R8 |
| Errors | inline `form-message`; the challenge card shakes on a wrong code |

## Rules

**Onboarding**

- **R1.** The welcome screen appears only when the user is not onboarded **and**
  has no transactions, no budgets, no goals, no loans **and** no second factor.
  Anyone with data or a second factor goes straight to their ledger. This is
  deliberately conservative: an existing account must never be sent back through
  setup, and a single stale flag is not enough evidence that someone is new.
- **R2.** Sign-up asks exactly two things: **username** and **email**. Both are
  required. Resist adding a third field — every one costs completions.
- **R3.** The form carries `novalidate`; validation messages are the app's own,
  not browser bubbles.
- **R4.** Errors are per-field and appear on submit, not on blur-of-empty.
- **R5.** On success: create the user, start the session, redirect to
  `/overview`.
- **R6.** *Skip and use the defaults* marks the user onboarded and does
  **nothing else**. It does not set a name, a currency, or a second factor.
- **R7.** Currency and security settings are deliberately **not** part of
  onboarding. They live in Settings and the account menu, changeable at any time.
  Onboarding's job is to end.

**Second factor**

- **R8.** Enrollment shows a QR code rendered as inline SVG by our own encoder
  (byte mode, EC level M, versions 1–10, GF(256) Reed–Solomon, BCH
  format/version info, eight-mask penalty scoring). Encoding a `otpauth://` URI
  is a bounded problem and a QR library is a large dependency for one screen.
- **R9.** Enrollment is not active until a valid code is submitted. An abandoned
  enrollment leaves no usable row.
- **R10.** Turning the second factor **off requires a current valid code**. No
  exceptions, including for the account owner — otherwise a hijacked session
  disables it in one click.
- **R11.** Verification accepts the neighboring 30-second windows for clock
  drift (±1 period), and no wider. ±2 is a meaningfully larger attack window for
  no real usability gain.
- **R12.** After **5 failed attempts**, a **15-second cooldown**; the attempt
  counter resets when the cooldown starts. Enforced **server-side** per
  identifier *and* per IP — a client-side counter is not a control once there is
  a network boundary.

**Session**

- **R13.** *Lock now* in the account menu ends the session and redirects to
  sign-in. Nothing of the ledger is painted behind the sign-in or challenge
  screen — not for a frame.
- **R14.** `middleware.ts` gates the whole `(app)` route group. An
  unauthenticated request to any of it redirects to `/sign-in?next=<path>`.
- **R15.** The session resolves **before** any ledger content renders, so a
  ledger is never shown and then covered. This is middleware plus `requireUser()`
  in the layout — never a client effect that paints first and redirects second.
- **R16.** Sign-**in** never reveals whether an email is registered. Sign-**up**
  may, on the email field, because it has to.

## States

| State | Behavior |
|---|---|
| No session | redirect to `/sign-in`, preserve `next` |
| Session, no second factor | straight to `/overview` |
| Session, second factor enrolled, unverified | `/verify`, no app chrome visible |
| Cooldown active | input disabled, countdown in the message, card shakes |
| Email already registered | field error on sign-up; silent on sign-in (R16) |

## Acceptance criteria

- [ ] Sign-up: two fields, both required, the app's own messages, and it never
      runs twice for the same account
- [ ] *Skip* marks onboarded and writes nothing else (R6)
- [ ] A user with data but an unset onboarded flag is **not** sent to the
      welcome screen (R1)
- [ ] TOTP codes verify against an independent implementation; ±1 window
      accepted, ±2 rejected (R11)
- [ ] The enrollment QR scans in a real authenticator app
- [ ] Disabling the second factor without a current code is refused (R10)
- [ ] The cooldown holds when the client-side counter is bypassed (R12)
- [ ] No ledger content is present in the DOM behind the challenge screen (R13)
- [ ] A direct request to `/transactions` while signed out redirects and returns
      after sign-in (R14)

## Out of scope

Social providers, password reset, email verification, household/multi-user
accounts, account deletion, device/session management. All post-v1.

## Open questions

1. **Primary credential** — magic link or password? Magic link is the
   recommendation: nothing to store, nothing to leak, and it keeps sign-up at
   exactly two fields (R2). The cost is a hard dependency on email delivery,
   which needs a provider decision in phase 3.
2. Does *Lock now* end the session outright, or keep it and require only the
   second factor to resume? The second is friendlier; the first is correct on a
   shared machine. Recommendation: end it, and revisit if people complain.
