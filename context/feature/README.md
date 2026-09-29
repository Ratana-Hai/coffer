# Coffer — Feature Specs

One spec per feature, for the architecture described in
[`PROJECT_OVERVIEW.md`](../../PROJECT_OVERVIEW.md).

| # | Spec | Slice | Primary tests |
|---|---|---|---|
| 00 | [Conventions](00-conventions.md) | — | — |
| 01 | [Auth & onboarding](01-auth-and-onboarding.md) | `features/auth` | E2E + integration |
| 02 | [Overview](02-overview.md) | `features/overview` | E2E |
| 03 | [Transactions](03-transactions.md) | `features/transactions` | E2E + integration |
| 04 | [Budgets](04-budgets.md) | `features/budgets` | unit (bands) + E2E |
| 05 | [Loans](05-loans.md) | `features/loans` | unit (math) + E2E |
| 06 | [Goals](06-goals.md) | `features/goals` | integration (concurrency) + E2E |
| 07 | [Settings](07-settings.md) | `features/settings` | E2E + unit (contrast) |
| 08 | [App shell](08-app-shell.md) | `components/layout` | E2E (geometry) |

Read **00-conventions** first. It defines the money, date, category and action
rules the other eight assume rather than repeat.

## How to read a spec

Each follows the same ten headings, so two features can be diffed against each
other:

**Purpose → Routes & files → Data → Validation → Server API → UI → Rules →
States → Acceptance criteria → Out of scope.**

**Rules** are numbered and normative — `R3` is a citable thing. **Acceptance
criteria** are the checklist a pull request is reviewed against; each one is
meant to be a test that either passes or does not.

Where a spec leaves a decision open it says so under **Open question**, with a
recommendation. Those are the parts to settle before writing the migration, not
after.

## Build order

Specs 01 → 08 are roughly the order to build them, matching the delivery phases
in the overview. Two gate everything else:

- **05 Loans** carries the only mathematics in the product. Build
  `lib/finance/amortization.ts` and get its unit suite green before any UI.
- **01 Auth** establishes `userId`, which every other query filters on. Nothing
  is safe to build multi-tenant until it exists.
