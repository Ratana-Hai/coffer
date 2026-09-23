# 00 — Conventions

Shared rules every feature spec assumes. Read once; the other specs do not
repeat them.

---

## 1. Money

| | |
|---|---|
| Storage | `numeric(14,2)` in Postgres. Never `float`, never `double precision` |
| In TypeScript | integer **minor units** (cents) inside `lib/finance/`; formatted strings at the edge |
| Comparison | never `===` on a computed amount. "Cleared" means `balance <= 0.005` |
| Rounding | half-up, at display time only. Never round mid-calculation in a schedule |

A schedule that stops closing to zero is almost always float cents. This is the
most expensive bug class in the product, which is why the rule is here and not
buried in the loans spec.

Two formatters, both in `lib/finance/money.ts`:

- `fmtMoney(n)` — the exact amount, used everywhere by default.
- `fmtCompact(n)` — the glance form (`12.4M`) for stat tiles only. Anything
  rendered compact must carry the exact value in a `title` attribute.

## 2. Currency

Four supported currencies, in this fixed picker order:

| Code | Symbol | Decimals | Position |
|---|---|---|---|
| `USD` | `$` | 2 | prefix |
| `KHR` | `៛` | 0 | suffix |
| `EUR` | `€` | 2 | prefix |
| `GBP` | `£` | 2 | prefix |

- The order is deliberate, not alphabetical.
- A custom symbol (max 4 characters) overrides the preset's **symbol only**.
  Code, decimals and position are unchanged.
- **KHR has 0 decimals and a suffix position.** Any formatter, meter label or
  chart axis that assumes two decimals and a prefix is wrong. Test with KHR.
- Currency is a *display* preference. It never converts stored amounts.

## 3. Dates

- A transaction date is a **calendar day** → `date` in Postgres, `YYYY-MM-DD`
  string in transport. No timezone, ever.
- `createdAt` and audit fields are **instants** → `timestamptz`.
- Month keys are `YYYY-MM`. "This month" means the user's local month.
- Sort order for any transaction list is `date DESC, id DESC` — the id tiebreak
  keeps same-day rows stable across renders.

## 4. Categories

Nine categories. `slot` is the index into the mode's color column and is the
**color-vision-deficiency safety mechanism** — it is a stored constant, not a
render-time array position, so it must never be re-derived from ordering.

| key | label | slot | notes |
|---|---|---|---|
| `food` | Food & Dining | 0 | |
| `transport` | Transport | 1 | |
| `housing` | Housing | 2 | |
| `utilities` | Utilities | 3 | |
| `entertainment` | Entertainment | 4 | |
| `health` | Health | 5 | |
| `shopping` | Shopping | 6 | |
| `loan` | Loan payments | 7 | **`auto`** — written only by the Loans feature, never selectable by hand |
| `other` | Other | 8 | residual bucket; neutral gray, not a ninth hue |

- **Manual categories** are the 8 selectable ones — everything except `loan`.
  Any "N of 8 categories" copy derives from that list, never from a literal.
- An unknown category key resolves to `other`. It does not throw.
- Categories apply to **expenses only**. Income rows have no category.

## 5. Server action contract

Every action in every feature does the same four things in the same order:

```
authenticate  →  validate  →  delegate  →  revalidate
requireUser()    Zod parse    service.x()   revalidatePath()
```

and returns the same shape:

```ts
// src/lib/action-state.ts
export type ActionState<T = void> =
  | { ok: true; data?: T }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string[]> }
```

Rules:

- `userId` comes from the session. It is never read from `FormData`, a URL
  param, or a header.
- Every repository function takes `userId` as its **first** argument and filters
  on it. A repository function without a `userId` parameter is a bug.
- An action never does arithmetic. If it needs a number computed, it calls
  `lib/finance/`.
- An action that mutates something visible on Overview revalidates `/overview`
  as well as its own route.
- Cross-entity writes happen in **one** database transaction, in a service.

## 6. Validation

One Zod schema per entity in `features/<slice>/schema.ts`, imported by both the
client form (`zodResolver`) and the server action (`safeParse`). There is no
third place where the rules could disagree.

Every constraint the UI implies must also be enforced server-side. An input's
`min`/`max` is a hint to the browser, not a control.

Error messages are the **app's own**: sentence case, specific, no trailing
period — `Amount must be more than zero`, not `Invalid input`. Forms carry
`novalidate` so browser validation bubbles never appear.

## 7. States every list must handle

| State | Requirement |
|---|---|
| Loading | `loading.tsx` skeleton at the same row height as real content — no layout shift |
| Empty | a specific sentence naming the next action, e.g. *"No savings goals yet — create one above."* Never a bare "No data" |
| Error | `error.tsx` with a retry, and the failure logged server-side |
| Partial | if one card of a page fails, the rest still render (per-card `<Suspense>` boundaries) |

## 8. Accessibility floor

Non-negotiable, and asserted by tests rather than reviewed by eye:

- Contrast ≥ **4.5:1** for all text against every base tone, in both modes,
  including muted text at its smallest use.
- Accent-derived tokens — text *on* the accent, and the accent *as* text — are
  chosen by **measured** WCAG contrast, not a luminance threshold. The shortcut
  breaks mid-tone accents.
- Touch targets ≥ 44×44 CSS px below 880px.
- Every icon-only control has an `aria-label`.
- Hover styling is gated behind `@media (hover: hover) and (pointer: fine)`.
- Color never carries meaning alone — every status has text beside its dot.
- Layout holds down to **320px** wide, with no horizontal body scroll.

## 9. Content

- User-supplied text (descriptions, goal names, loan names) is escaped on
  render. No `dangerouslySetInnerHTML` anywhere in a feature slice.
- Pluralization is explicit and tested: `1 loan` / `3 loans` / `No loans
  tracked`. Never `1 loan(s)`.
- Destructive copy names what is lost and whether it can be undone.

## 10. Definition of done for any feature

- [ ] Zod schema shared by form and action
- [ ] Query is `server-only` and `cache()`-wrapped
- [ ] Repository filters on `userId`
- [ ] Empty, loading and error states implemented
- [ ] Unit tests for any pure logic it adds to `lib/`
- [ ] The acceptance criteria in its spec pass
- [ ] Works at 320px and at 1440px, in light and dark, on `cool`/`neutral`/`contrast`
- [ ] Verified once with a **KHR** ledger (0 decimals, suffix symbol)
