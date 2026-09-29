# 06 — Savings Goals

## Purpose

Name a target, add funds toward it, watch a meter fill. The smallest feature in
the product — and the one with the most consequential open decision, which is
stated at the bottom rather than quietly settled in code.

---

## Routes & files

```
src/app/(app)/goals/page.tsx
src/features/goals/
  components/AddGoalPanel.tsx      'use client' — ResponsivePanel
  components/GoalCard.tsx          'use client' — inline add-funds
  components/GoalGrid.tsx          server
  actions.ts  queries.ts  schema.ts
src/server/repositories/goals.ts
```

## Data

```ts
goals (
  id, userId, name text,
  target numeric(14,2),
  saved  numeric(14,2) not null default 0,
  createdAt timestamptz
)
```

`saved` is a running total incremented by the add-funds action — see the open
question before treating that as settled.

## Validation

```ts
export const goalSchema = z.object({
  name:   z.string().trim().min(1, 'Name this goal').max(60),
  target: z.coerce.number().min(1, 'Set a target amount'),
})

export const addFundsSchema = z.object({
  goalId: z.string().uuid(),
  amount: z.coerce.number().gt(0, 'Amount must be more than zero'),
})
```

## Server API

```ts
// queries.ts
getGoals(): (Goal & { pct: number })[]
getGoalTotals(): { saved: Minor; target: Minor; pct: number }   // Overview tile 5

// actions.ts
createGoal(prev, formData): ActionState
addFunds(prev, formData): ActionState
deleteGoal(goalId): ActionState
```

All three revalidate `/goals` and `/overview`.

`addFunds` must be an **atomic increment** in SQL (`set saved = saved + $1`),
never a read-modify-write in JS. Two tabs adding funds at once is a real
scenario, and read-modify-write silently loses one of them.

## UI

Cards in a responsive grid:

```
┌──────────────────────────────── ✕ ┐
│ Emergency fund                    │
│ $1,200.00 of $5,000.00 (24%)      │
│ ██████░░░░░░░░░░░░░░░░░░░░░░░     │
│ [ Add funds ] [Add]               │
└───────────────────────────────────┘
```

| Part | Detail |
|---|---|
| Remove | icon button, top-right, `aria-label="Remove goal"` |
| Figures | `saved of target (N%)`, rounded percent |
| Meter | accent fill, width capped at 100% |
| Add funds | `number` input `min=0.01 step=0.01` + Add button |

Panel copy: *New savings goal* — *Set a target and add funds as you save*.
Card copy: *Your goals* — *Progress toward each target*.

shadcn: `card`, `input`, `button`, `progress`, `alert-dialog` (for R6).

## Rules

- **R1.** `pct = min(saved / target * 100, 100)`, displayed as `round(pct)`.
- **R2.** The meter fill is capped at 100%. Over-saving shows a full bar, and
  the figures still show the true amounts.
- **R3.** `target` is at least 1, so the percentage never divides by zero. The
  Overview tile guards `target === 0` anyway (spec 02, R3) — cheap insurance
  against a future import path.
- **R4.** Add funds is an atomic increment. A non-positive or non-numeric amount
  does nothing and does not error.
- **R5.** Adding funds writes **no transaction** as specified — this is the
  open question below, and whichever way it is answered, it is answered once,
  here.
- **R6.** Deleting a goal takes a confirm naming the goal and its saved total.
  Unlike a transaction, a goal is not one row to re-enter: it carries an
  accumulated total that cannot be reconstructed.
- **R7.** Goal names are escaped on render (conventions §9).
- **R8.** The view header reads `1 active goal` / `N active goals`.
- **R9.** A goal at or over 100% keeps its add-funds control and is not
  archived. There is no completion state in v1.

## States

| State | Behavior |
|---|---|
| No goals | *"No savings goals yet — create one above."* |
| At 0% | meter empty, figures show `$0.00 of $X` |
| At/over 100% | meter full, figures show the real amounts |
| Adding | that card's Add button disabled; other cards unaffected |
| Deleting | confirm dialog naming the goal and its saved total |

## Acceptance criteria

- [ ] Percent is rounded and capped for display; the meter never overflows its
      track
- [ ] Two concurrent `addFunds` calls both land (R4) — integration test, not E2E
- [ ] Blank or `0` in add-funds is a no-op with no error
- [ ] Overview tile 5 matches the sum of card figures
- [ ] Deleting asks first and names the goal (R6)
- [ ] A 60-character goal name does not break the card at 320px
- [ ] Meter renders correctly in all three base tones, both modes
- [ ] Correct with a KHR ledger (whole numbers, suffix symbol)

## Out of scope

Target dates, contribution schedules, per-goal interest, reordering, archiving
completed goals, linking a goal to a specific account.

## Open question — settle this before the table ships

**Are goals connected to the ledger?** As specified, no: adding $500 to a goal
moves no money, writes no transaction, and does not change the net balance.
Nothing stops someone "saving" money they never had, and the Overview tile
reports a percentage no other figure on the page corroborates.

Three options:

1. **Keep it separate** — goals are an aspiration tracker and the UI says so.
   Cheapest, no migration, but the number means less than it looks like it does.
2. **Write a transfer transaction on add-funds** — a `goalId` column mirroring
   `loanId`, exactly the pattern Loans already uses for payments (spec 05, R6).
   Goals become honest, and there is **one** mechanism for "a feature that moves
   money" rather than two.
3. **Derive `saved` from transactions entirely**, dropping the column. Most
   correct, largest change, and it makes "add funds" a ledger entry rather than
   a counter.

**Recommendation: option 2.** It matches the loans pattern, so the codebase has
one answer to the same question. Decide before this table ships — retrofitting
accumulated `saved` totals into transactions afterwards means inventing dates
for money that was already counted.
