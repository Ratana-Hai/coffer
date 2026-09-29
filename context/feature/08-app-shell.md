# 08 — App Shell

## Purpose

The chrome every feature renders inside: navbar, account menu, view header, stat
grid, the responsive overlay panel, and the mobile tab bar.

Treat this spec as normative for **layout**. The feature specs assume it, and
most of the expensive bugs in a UI like this are geometry rather than logic —
which is why the rules below read like a list of traps.

---

## Routes & files

```
src/app/(app)/layout.tsx               chrome + <Suspense> + <Toaster>
src/components/layout/
  Navbar.tsx                           three-column, centered nav
  AccountMenu.tsx                      'use client' — avatar dropdown
  MobileTabBar.tsx                     ≤880px
  ViewHeader.tsx                       title + period
  StatGrid.tsx                         hidden on /settings
src/components/shared/ResponsivePanel.tsx
src/hooks/use-media-query.ts
src/app/globals.css                    tokens, then components, then responsive
```

## Navigation

Five items, in this order: **Overview, Transactions, Budgets, Loans, Goals**.

Settings is **not** in the nav — it is reached from the account menu only, and
it is the one view with no stat tiles. Navigation is `<Link>` per item with
`usePathname()` for the active state.

## View header

Title on the left, a period/summary string on the right. Every string is
computed, and the pluralization is part of the spec:

| Route | Title | Period |
|---|---|---|
| `/overview` | Overview | `September 2025` |
| `/transactions` | Transactions | `1 entry logged` / `N entries logged` |
| `/budgets` | Budgets | `September 2025 · N of 8 categories budgeted` |
| `/loans` | Loans | `1 loan · $X outstanding` / `N loans · $X outstanding` / `No loans tracked` |
| `/goals` | Savings goals | `1 active goal` / `N active goals` |
| `/settings` | Settings | `Profile, currency and data` |

**Footer note**, below everything:

- on `/settings`: *"Settings apply when you save — everything else saves
  automatically."*
- everywhere else: *"Saved automatically — only visible to you."*

## The responsive overlay panel

One mechanism, two shapes by breakpoint. This is the single most fragile piece
of the UI and the most worth testing.

| Width | Shape | shadcn primitive |
|---|---|---|
| `> 880px` | right-hand **drawer** | `sheet` |
| `<= 880px` | bottom **sheet** | `drawer` (Vaul) |

Both share the same internal layout — **head / scrolling body / pinned footer** —
so the submit button stays put however long the form is.

```tsx
export function ResponsivePanel(props: PanelProps) {
  const isDesktop = useMediaQuery('(min-width: 881px)')
  return isDesktop ? <Sheet {...props} /> : <Drawer {...props} />
}
```

Users: the add-transaction form, the add-loan form, the new-goal form, and the
account menu.

## Rules

- **R1.** The navbar is a **three-column** grid so the nav is optically centered
  regardless of the widths of the brand and the avatar. Centering must hold
  across widths — a flex row with `justify-between` drifts as either side grows.
- **R2.** At `<= 880px` the nav collapses to a **bottom tab bar**. The boundary
  is exact; test at 880 and 881. Labels truncate rather than wrap.
- **R3.** **`backdrop-filter` makes an element the containing block for
  `position: fixed` descendants.** The mobile header therefore drops its blur —
  otherwise the bottom tab bar anchors to the header instead of the viewport.
  Keep this as a comment in the CSS; it fails silently and is very hard to find
  from the symptom.
- **R4.** **The responsive blocks stay last in the stylesheet.** They share
  specificity with the base component rules, so source order is what lets them
  win. Moving them earlier silently breaks the overlay geometry — no error, just
  a wrong-shaped panel.
- **R5.** Opening a panel locks body scroll and **compensates for the scrollbar
  width** by adding it back as padding; otherwise the page shifts sideways on
  open.
- **R6.** The **stat grid is hidden on `/settings`** and shown on every other
  view (spec 07, R6).
- **R7.** Panel footers are pinned: the internal bands tile the panel height, and
  the footer holds position while the body scrolls.
- **R8.** The scrim closes the panel; so do Escape and the close control. Focus
  is trapped while open and returns to the trigger on close.
- **R9.** Hover styling is gated behind `@media (hover: hover) and (pointer:
  fine)`, so touch devices do not get stuck in hover states after a tap.
- **R10.** Layout holds to **320px**. No horizontal body scroll at any width;
  wide content (the amortization schedule, any table) scrolls inside its own
  container.
- **R11.** The account menu uses the same panel mechanism — drawer above 880px,
  bottom sheet below.
- **R12.** The avatar shows initials derived from the display name, updating live
  with the Settings draft (spec 07).

## Account menu contents

In order: account head (avatar, name, *Personal ledger*) → **Display currency**
quick-switch (immediate, spec 07 R8) → divider → **Lock now** (hidden when no
second factor is enrolled) → **Settings**.

## States

| State | Behavior |
|---|---|
| Route transition | the shell persists; only the page area suspends |
| Panel open, resize across 880px | shape switches without losing form state |
| Slow query | `loading.tsx` inside the shell; nav stays interactive |
| Offline / action failure | toast via `sonner`; the shell never unmounts |

## Acceptance criteria

- [ ] Navbar stays optically centered across widths, with a long brand and a long
      display name (R1)
- [ ] Tab bar appears at 880px and not at 881px; labels truncate (R2)
- [ ] The bottom tab bar is anchored to the viewport, not the header, on mobile
      (R3)
- [ ] Opening a panel does not shift the page horizontally (R5)
- [ ] Panel footers hold position while the body scrolls (R7)
- [ ] Escape, the scrim and the close control all close a panel; focus returns
      to the trigger (R8)
- [ ] No hover state persists after a tap on a touch device (R9)
- [ ] No horizontal body scroll at 320px on any route (R10)
- [ ] View header strings match the table above, including every plural form
- [ ] The footer note switches on `/settings` and back
- [ ] Stat grid absent on `/settings`, present elsewhere (R6)

## Note on testing this

Assert **computed values** — contrast ratios, resolved tokens, bounding boxes —
rather than comparing screenshots. The failures this spec exists to prevent all
look fine in an image: a sheet 20px off the bottom edge, a 3.1:1 label, a bar
anchored to the wrong containing block. A visual diff passes all three.
