# 02 — Overview

## Purpose

The landing view: five stat tiles, two charts and the last five transactions.
It is read-only — every number on it is derived, nothing here is a source of
truth. That makes it the natural integration test for every other slice: if a
figure on Overview disagrees with its own feature page, one of the two is wrong.

---

## Routes & files

```
src/app/(app)/overview/page.tsx        RSC, composes the cards
src/app/(app)/overview/loading.tsx     skeleton
src/features/overview/queries.ts       getOverview()
src/features/overview/components/
  CategoryChart.tsx                    'use client' (Recharts)
  TrendChart.tsx                       'use client' (Recharts)
  RecentActivity.tsx                   server, reuses TransactionRow
```

The stat grid itself is rendered by the `(app)` layout, not this page — it
appears above every view except Settings (spec 08, R6).

## Data

No tables of its own. One query, one round trip:

```ts
getOverview(): {
  balance: Minor            // all-time income − expenses
  monthIncome: Minor        // this month
  monthExpense: Minor
  debt: Minor               // Σ per-loan outstanding balance
  loanCount: number
  goalSaved: Minor
  goalTarget: Minor
  byCategory: { key, label, slot, total }[]     // this month, expenses only
  trend:      { key, label, income, expense }[] // last 6 months
  recent:     Transaction[]                     // 5
}
```

Compute the aggregates in **SQL** (`sum … group by`), not by loading every
transaction and reducing in JS. `debt` is the exception: outstanding balance
needs each loan's payments folded in order (spec 05), so fetch loans with their
payments and fold in `lib/finance/`.

## Server API

Read-only. No actions. `getOverview` is `cache()`-wrapped so the tiles, both
charts and the recent list share one execution.

## UI

### Stat tiles

Five, in this order. Each is label / value / foot. The value renders compact;
the **exact** amount goes in `title`.

| # | Label | Value | Tone | Foot |
|---|---|---|---|---|
| 1 | Net balance | all-time balance | `pos` if ≥ 0 else `neg` | `All time` |
| 2 | Income this month | month income | `pos` | month label |
| 3 | Expenses this month | month expenses | `neg` if > 0 | month label |
| 4 | Outstanding debt | Σ loan balances | `neg` if > 0 | `1 loan` / `N loans` / `No loans yet` |
| 5 | Toward savings goals | `saved / target` as % | neutral | `X of Y` or `No goals yet` |

### Charts

| Card | Content |
|---|---|
| **Spending by category** — *This month's expenses, by category* | one segment per category present, colored by its `slot` |
| **Income vs. expenses** — *Last 6 months* | grouped bars, legend swatches for income and expense |

Both read their palette from CSS variables, so light/dark and the three base
tones work with no JS palette switch. Tooltips follow the cursor and flip at the
viewport edge rather than being clipped.

### Recent activity

*Your last 5 transactions* — rendered with the same `TransactionRow` component
as spec 03, so the two views cannot drift. Delete is available here too.

## Rules

- **R1.** Every figure is derived. Overview writes nothing.
- **R2.** "This month" is the user's local month, and the period label is the
  long form: `September 2025`.
- **R3.** Goal percentage is `round(saved / target * 100)`, and **0 when
  `target` is 0** — never `NaN`, never a division by zero.
- **R4.** Tile 4's foot pluralizes: `1 loan`, `3 loans`, `No loans yet`.
- **R5.** Tile values are compacted (`12.4M`); the exact value lives in `title`
  so it is reachable on hover and by assistive tech.
- **R6.** Charts show only categories with expenses **this month**. An absent
  category is absent, not a zero-height bar.
- **R7.** Category color comes from the stored `slot`, not array position
  (conventions §4).
- **R8.** The category chart covers **expenses only**. Income never appears in
  it.
- **R9.** The trend chart always shows exactly 6 buckets, including months with
  no activity — a gap in the axis reads as missing data rather than a quiet
  month.
- **R10.** Figures shown here must be produced by the same functions their
  feature pages use. Two implementations of "outstanding debt" will diverge.

## States

| State | Behavior |
|---|---|
| Loading | skeleton tiles at final height, so nothing shifts when data lands |
| No transactions at all | tiles render zeros; category chart empty state; recent list: *"Nothing logged yet."* |
| No expenses this month, some income | category chart empty state; trend chart still renders |
| No goals | tile 5 reads `0%` with foot `No goals yet` |
| One card fails | its own `<Suspense>`/error boundary; the other cards still render |

## Acceptance criteria

- [ ] Five tiles, in the order above, with the correct tone class
- [ ] Exact amount present in `title` on every compacted value
- [ ] Stat tiles and transaction rows hold down to **320px**
- [ ] Goal tile reads `0%`, not `NaN%`, with no goals
- [ ] Debt tile matches the Loans page total to the cent (R10)
- [ ] Trend chart shows 6 buckets including empty months
- [ ] Chart colors re-resolve on a mode change without a reload
- [ ] Deleting from the recent list updates the tiles in the same navigation
- [ ] Correct with a KHR ledger — whole numbers, suffix symbol, in tiles,
      tooltips and axes

## Out of scope

Date-range picking, month navigation, custom or reorderable dashboards, chart
export. Overview is fixed to the current month by design; adding navigation has
a knock-on for budgets (spec 04, open question).

## Open question

The debt tile is the one figure needing per-loan payment folding. If loan counts
grow, cache the per-loan status and invalidate on payment write. Premature now —
worth a note in the loans repository so it is not a surprise later.
