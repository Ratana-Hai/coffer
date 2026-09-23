# 04 — Budgets

## Purpose

A monthly spending limit per category, with this month's spend measured against
it. The simplest slice in the product: one row per manual category, one number
per row, three status bands.

---

## Routes & files

```
src/app/(app)/budgets/page.tsx
src/features/budgets/
  components/BudgetList.tsx        server
  components/BudgetRow.tsx         'use client' — has an inline input
  actions.ts  queries.ts  schema.ts
src/server/repositories/budgets.ts
src/lib/finance/budget.ts          status bands — pure, unit-tested
```

## Data

```ts
budgets (
  id, userId,
  categoryKey text,               -- one of the 8 manual categories
  monthlyLimit numeric(14,2),
  unique (userId, categoryKey)
)
```

**A row exists only when a limit is set.** Absent row means "No limit set" —
which is what makes clearing a limit (R3) a delete rather than a stored zero,
and lets the header count budgeted categories honestly.

## Validation

```ts
export const budgetSchema = z.object({
  categoryKey: z.enum(MANUAL_CATEGORY_KEYS),         // 'loan' is not in the enum
  monthlyLimit: z.coerce.number().nonnegative(),     // 0 or blank ⇒ clear
})
```

## Server API

```ts
// queries.ts
getBudgets(month: MonthKey): {
  categoryKey, label, slot, limit: Minor | null,
  spent: Minor, pct: number, status: BudgetStatus | null
}[]

// actions.ts
setBudget(prev, formData): ActionState     // upsert, or delete when ≤ 0
```

`getBudgets` returns **all 8 manual categories**, budgeted or not — the page
always shows the full list, so the query does the left join rather than the
component padding the result.

`setBudget` revalidates `/budgets` and `/overview`.

## UI

One row per manual category:

```
● Food & Dining              $340.00 / $500.00  [ 500 ] [Save]
  ████████████░░░░░░░░░░░░
  ● On track — 68% used
```

| Part | Detail |
|---|---|
| Dot | the category's slot color |
| Figures | `spent / limit`, or **No limit set** when absent |
| Input | `number`, `min=0 step=0.01`, placeholder *Limit*, pre-filled with the current limit |
| Save | ghost button, per row |
| Meter | shown **only** when a limit is set; fill capped at 100% |
| Pill | dot + status text + `N% used`, colored to match the band |

shadcn: `card`, `input`, `button`, `progress` (restyled to the meter tokens).

## Rules

- **R1.** Rows are the **8 manual categories**, in canonical order. *Loan
  payments* never appears — it is written automatically, so budgeting it would
  measure a repayment schedule against a discretionary limit.
- **R2.** Spend is **this month's expenses** in that category. Income is never
  counted.
- **R3.** Saving a blank, zero, negative or non-numeric limit **deletes** the
  budget. It does not store a zero, and it does not raise an error — clearing a
  limit is a normal thing to want, not a mistake.
- **R4.** Status bands, from `ratio = spent / limit`:

  | Ratio | Status | Token |
  |---|---|---|
  | `>= 1` | **Over budget** | `--critical` |
  | `>= 0.7` | **Near limit** | `--warning` |
  | `< 0.7` | **On track** | `--good` |

  The 0.7 boundary is inclusive. These live in `lib/finance/budget.ts` and are
  unit-tested at 0.699 / 0.700 / 0.999 / 1.000.
- **R5.** The meter **fill** is capped at 100%, but the pill's percentage is
  **not** — 140% over budget reads `140% used` with a full bar. Capping the
  number as well would hide how far over you are.
- **R6.** No meter and no pill when there is no limit. The row is just a name
  and an input.
- **R7.** The view header reads `<Month> · N of 8 categories budgeted`, where
  the 8 is derived from the manual category list, never a literal.
- **R8.** Saving a limit is a normal action, applied immediately. Budgets has
  **no** draft model — only Settings defers writes (spec 07).
- **R9.** Color never carries the status alone: every band has its own text
  (*Over budget* / *Near limit* / *On track*) beside the dot.

## States

| State | Behavior |
|---|---|
| No limits set at all | all 8 rows render with *No limit set*; header reads `0 of 8` |
| Limit set, no spend | meter at 0%, **On track** |
| Over budget | full bar in `--critical`, pill shows the true percentage |
| Saving | that row's Save button disabled; other rows unaffected |
| Invalid input | treated as a clear (R3), never an error toast |

## Acceptance criteria

- [ ] Exactly 8 rows; *Loan payments* absent (R1)
- [ ] Bands at 0.699 → On track, 0.700 → Near limit, 1.000 → Over budget (unit)
- [ ] Blank + Save on a budgeted category removes the meter and pill, and the
      header count drops by one
- [ ] Loan payment transactions do **not** count toward any budget row
- [ ] Income in a budgeted category does not reduce the spend figure (R2)
- [ ] Percentages are correct with a KHR ledger (0 decimals)
- [ ] A 140%-spent row shows a full bar and `140% used`
- [ ] Meter colors re-resolve on a light/dark switch without a reload

## Out of scope

Per-month limit overrides, rollover of unspent budget, user-created categories,
notifications when a band is crossed.

## Open question

**Are limits standing or per-month?** As specified they are standing — one
limit, applied to whichever month is being viewed. That is correct while
Overview is pinned to the current month, but it becomes wrong the moment month
navigation ships (spec 02, out of scope), because past months would be measured
against today's limit.

If month navigation is on the roadmap, add `month` to the unique key **now** and
default to carrying the most recent limit backwards. Retrofitting it after rows
exist is a migration that has to invent history.
