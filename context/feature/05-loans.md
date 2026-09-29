# 05 — Loans

## Purpose

The only real mathematics in Coffer: amortizing loans, a payment ledger that
folds into a live balance, and a full schedule. It is also the only feature that
**writes transactions on another slice's behalf**.

Build it first. `lib/finance/amortization.ts` is four pure functions with no I/O,
and its unit suite should be green before a single component exists.

---

## Routes & files

```
src/app/(app)/loans/page.tsx
src/app/(app)/loans/[loanId]/page.tsx      full schedule, deep-linkable
src/features/loans/
  components/AddLoanPanel.tsx              'use client' — live preview
  components/LoanCard.tsx                  server
  components/RecordPaymentForm.tsx         'use client'
  components/AmortSchedule.tsx             server
  actions.ts  queries.ts  schema.ts
src/server/repositories/loans.ts
src/server/services/loans.ts               payment = loan + transaction, one tx
src/lib/finance/amortization.ts            the domain core
```

## Data

```ts
loans (
  id, userId, name, principal numeric(14,2),
  rate numeric(6,3),        -- percent per year
  termMonths integer,
  startDate date            -- "first payment"
)
```

Payments are **not** a table. A payment is a row in `transactions` with `loanId`
set. One ledger means a loan payment appears in the transaction list, the
expense total and the trend chart with no extra wiring — and it means there is
no second place where the money could be recorded differently.

## The domain core

All four are pure, take a loan (and its payments), touch no I/O:

```ts
monthlyRate(loan)      = rate / 100 / 12

scheduledPayment(loan) = r === 0
  ? principal / n
  : principal * r / (1 - (1 + r) ** -n)

loanStatus(loan, payments) → {
  payment, balance, paid, interestPaid, count, last, shortfall, cleared
}

amortSchedule(loan) → { i, payment, interest, principal, balance }[]
```

`loanStatus` walks payments in `date ASC, id ASC`; for each, interest for the
period comes off first and the remainder reduces principal. Balance floors at 0.
This is what makes payments of **any size** behave correctly — overpayments,
underpayments and irregular schedules alike, rather than assuming everyone pays
exactly the scheduled amount exactly on time.

Verify against textbook amortization values, not against our own output.

## Validation

```ts
export const loanSchema = z.object({
  name:       z.string().trim().min(1, 'Name this loan').max(60),
  principal:  z.coerce.number().min(1, 'Enter the amount borrowed'),
  rate:       z.coerce.number().min(0).max(100, 'Rate must be 0–100'),
  termMonths: z.coerce.number().int().min(1).max(600, 'Term must be 1–600 months'),
  startDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose the first payment date'),
})

export const paymentSchema = z.object({
  loanId: z.string().uuid(),
  amount: z.coerce.number().gt(0, 'Amount must be more than zero'),
  date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
```

## Server API

```ts
// queries.ts
getLoans(): (Loan & { status: LoanStatus })[]
getLoan(loanId): Loan & { status, schedule, payments }
getTotalDebt(): Minor                        // shared with the Overview tile

// actions.ts
createLoan(prev, formData): ActionState
recordPayment(prev, formData): ActionState   // R6 — writes a transaction
deleteLoan(loanId): ActionState              // R9
```

`recordPayment` revalidates `/loans`, `/transactions` and `/overview`.

## UI

### Add panel

Fields, left to right: **Loan name**, **Amount borrowed**, **Rate % / year**,
**Term (months)**, **First payment**. Sub-copy: *Enter the terms and Coffer
works out what you owe each month*.

Below the fields, a **live preview** of the scheduled monthly payment as the
user types — computed client-side from the same `lib/finance` module the server
uses, so preview and stored value cannot disagree.

### Loan card

Name, then a figure grid — scheduled payment, balance, paid to date, interest
paid, payment count, last payment date — then the controls:

```
[ amount ] [ date=today ] [Record payment]   [View schedule]   [✕]
```

Two callouts:

- **Shortfall** — a recorded payment did not cover its period's interest:
  *"A payment didn't cover the interest for its period — the balance grew."*
- **Cleared** — balance at or below the epsilon; payment controls are replaced
  by a cleared state and the loan is retained, not deleted.

### Schedule

Table: `# | Payment | Interest | Principal | Balance left`. Rows up to the
payment count are marked done. Horizontally scrollable in its own container at
narrow widths — the page body never scrolls sideways.

shadcn: `card`, `input`, `button`, `table`, `collapsible`, `alert`.

## Rules

- **R1.** A **0% rate** uses straight division (`principal / termMonths`). A 0%
  loan is valid input — family loans exist — not a divide-by-zero.
- **R2.** `loanStatus` applies payments in `date ASC, id ASC`. Order is part of
  the result: reordering changes the interest split.
- **R3.** Interest first, remainder to principal, per payment.
- **R4.** `shortfall` is true when any payment's principal portion is `<= 0`. It
  is a **warning**, not a rejection — the payment happened, and refusing to
  record reality would make the ledger wrong.
- **R5.** `cleared` is `balance <= 0.005`, never `=== 0` (conventions §1).
- **R6.** Recording a payment creates a transaction with exactly:

  ```ts
  { date: input || today, desc: `Loan payment — ${loan.name}`,
    amount, type: 'expense', category: 'loan', loanId: loan.id }
  ```

  Loan and transaction are written in **one database transaction**.
- **R7.** The payment amount defaults to empty; the date defaults to **today**.
  An empty or non-positive amount focuses the input and does nothing.
- **R8.** `amortSchedule` stops at `termMonths` **or** when the balance clears,
  and breaks out if the principal portion is `<= 0` — a rate high enough that
  the scheduled payment never amortizes produces a short table, not an infinite
  loop.
- **R9.** Deleting a loan removes the loan and **keeps its payment
  transactions**, with `loanId` set to null. The money left the account; the
  ledger must still show it. The confirm copy says so.
- **R10.** `getTotalDebt()` is the single source for the Overview debt tile and
  the view header. Two implementations would drift.
- **R11.** The view header reads `N loans · $X outstanding`, or `No loans
  tracked` when there are none.
- **R12.** Schedule open/closed is ephemeral UI state, not persisted. On the
  detail route it may be a URL param instead.

## States

| State | Behavior |
|---|---|
| No loans | *"No loans tracked"* in the header; empty state on the card |
| No payments yet | balance = principal, count 0, no last date |
| Shortfall | warning callout; payment still recorded |
| Cleared | payment controls replaced by a cleared badge; loan retained |
| Rate so high it never amortizes | short schedule (R8), no hang |
| Recording | button disabled; card refreshes with the new balance on success |

## Acceptance criteria

- [ ] Scheduled payment matches textbook amortization values (unit)
- [ ] Schedules close to zero across a range of rates and terms (unit)
- [ ] 0% loan: payment = `principal / termMonths` (R1)
- [ ] Underpayment raises `shortfall` and still records (R4)
- [ ] Overpayment reduces the balance by more than the scheduled principal and
      never drives it below zero
- [ ] Payments applied out of chronological insertion order still produce the
      date-ordered result (R2)
- [ ] Recording a payment produces a transaction visible on Transactions with
      category *Loan payments*
- [ ] Deleting the loan leaves those transactions in the ledger (R9)
- [ ] Debt tile equals the sum of card balances to the cent (R10)
- [ ] The live preview matches the payment stored on submit, to the cent
- [ ] A 600-month schedule scrolls inside its container; the page body does not
- [ ] A failed transaction write leaves neither loan nor payment behind (R6)

## Out of scope

Variable rates, extra-payment modeling, offset accounts, early-settlement
quotes, lender metadata, per-loan currencies, payment reminders.
