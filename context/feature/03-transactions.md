# 03 — Transactions

## Purpose

The ledger. Every other feature reads from it: budgets sum expenses by category,
loans fold payments into balances, Overview derives every tile from it.
Transactions is the only slice that owns rows other features depend on, so its
write path is the one to get exactly right.

---

## Routes & files

```
src/app/(app)/transactions/page.tsx      RSC, reads searchParams (await'd)
src/app/(app)/transactions/loading.tsx
src/app/(app)/transactions/error.tsx
src/features/transactions/
  components/TransactionRow.tsx          server — shared with Overview
  components/TransactionList.tsx
  components/AddTransactionPanel.tsx     'use client' — ResponsivePanel
  components/TypeToggle.tsx              'use client'
  actions.ts  queries.ts  schema.ts  types.ts
src/server/repositories/transactions.ts
```

## Data

```ts
transactions (
  id, userId, date, desc, amount numeric(14,2),
  type 'income'|'expense', category text null, loanId uuid null
)
index tx_user_date_idx on (userId, date desc)
```

- `category` is null for income (conventions §4).
- `loanId` is set **only** by the Loans feature. It is never settable from this
  form.

## Validation

```ts
export const transactionSchema = z.object({
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
  desc:     z.string().trim().min(1, 'Describe the transaction').max(120),
  amount:   z.coerce.number().gt(0, 'Amount must be more than zero'),
  type:     z.enum(['income', 'expense']),
  category: z.string().optional(),
})
.refine(v => v.type === 'income' || !!v.category, {
  path: ['category'], message: 'Choose a category',
})
.refine(v => v.category !== 'loan', {
  path: ['category'], message: 'Loan payments are recorded from the Loans page',
})
```

The second refine makes R7 unbypassable: `loan` is not in the select, and a
hand-crafted POST is rejected too.

## Server API

```ts
// queries.ts
getTransactions({ cursor, limit, type?, category?, month? }): Page<Transaction>
getRecentTransactions(limit = 5): Transaction[]

// actions.ts
createTransaction(prev, formData): ActionState
deleteTransaction(id: string): ActionState
```

Both actions revalidate `/transactions` and `/overview`; an expense also
revalidates `/budgets`, and a row with a `loanId` also revalidates `/loans`.

## UI

| Element | shadcn/ui | Notes |
|---|---|---|
| Trigger | `button` | *Add a transaction*, plus icon |
| Panel | `sheet` / `drawer` via `ResponsivePanel` | spec 08 |
| Type | segmented control | two buttons; Income active by default |
| Date | `input[type=date]` | defaults to today |
| Description | `input` | placeholder *e.g. Groceries at market* |
| Category | `select` | expense only, manual categories |
| Amount | `input[type=number]` | `min=0.01 step=0.01`, placeholder `0.00` |
| Submit | `button` | *Add*, pinned in the panel footer |
| List | `card` + `ul` | *All transactions* — *Most recent first* |

### Row anatomy

```
| MM-DD | description | category or "Income" | ±amount | ✕ |
   mono                 colored by slot      tone      icon-btn
```

- Date renders as `MM-DD`; the year is implied by the grouping and would cost
  width that descriptions need at 320px.
- Income rows show the literal **Income** in the category column, in the
  positive text tone.
- Amount is prefixed `+` for income and `−` (U+2212 minus, not a hyphen) for
  expense.
- The delete control is icon-only and carries `aria-label="Delete transaction"`.

## Rules

- **R1.** Sort is `date DESC, id DESC`. Same-day rows keep a stable order across
  renders.
- **R2.** Amount is always stored **positive**. Direction is carried by `type`,
  never by sign. A negative amount is a validation error, not an expense.
- **R3.** Category applies to expenses only. Switching the type toggle to Income
  hides the category field and clears its value.
- **R4.** The category select offers the 8 manual categories; `loan` is excluded.
- **R5.** The date field defaults to today.
- **R6.** Delete is immediate, single-click, no confirm. A transaction is one
  short row to re-enter, and a confirm on the most-used control in the product
  costs more than the occasional mistake. *(This decision lives here and applies
  to Overview's recent list too, since they share `TransactionRow`.)*
- **R7.** Rows with a `loanId` are created **only** through the Loans page.
  Deleting one from this list is allowed — it undoes the payment — but the
  confirm copy must say so: *"This is a loan payment. Deleting it raises the
  loan balance."* This is the one exception to R6.
- **R8.** Description is escaped on render (conventions §9).
- **R9.** The list is paginated by cursor, defaulting to 50 rows with
  infinite scroll. `date DESC, id DESC` is also the cursor key, so pagination
  and sort cannot disagree.

## States

| State | Behavior |
|---|---|
| Loading | skeleton rows at the real row height |
| Empty | *"No transactions yet — add your first one above."* |
| Submitting | submit disabled + spinner; panel stays open until success |
| Field error | inline under the field; panel stays open; focus moves to the first invalid field |
| Server error | toast; panel stays open; entered values preserved |
| Deleted | row removed optimistically; restored with a toast on failure |
| End of list | no spinner, no "load more" that does nothing |

## Acceptance criteria

- [ ] The add form works as a bottom sheet below 880px — fields stack, targets
      are ≥44px, the submit button stays pinned
- [ ] Rows stay legible and aligned down to 320px
- [ ] Switching to Income removes the category field and submits no `category`
- [ ] Posting `category: 'loan'` directly to the action is rejected (R7)
- [ ] Posting a negative amount is rejected (R2)
- [ ] Deleting a loan payment warns about the balance (R7)
- [ ] A KHR ledger renders whole numbers with the symbol as a **suffix**
- [ ] Adding a transaction updates the Overview tiles and the Budgets meter in
      the same navigation
- [ ] A 120-character description does not break row layout at 320px
- [ ] Scrolling to the end of a 500-row ledger loads every page exactly once,
      with no duplicated or skipped rows (R9)

## Out of scope

Editing a transaction (delete and re-add), attachments, recurring entries, bulk
import, search, tags. Search and edit are the likely v1.1 additions — the cursor
pagination in R9 is designed to accept a `q` filter without a redesign.
