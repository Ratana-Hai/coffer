# Current Feature: App Shell

## Status

In Progress

## Goals

- Build the persistent shell in `src/app/(app)/layout.tsx`: a left sidebar, a workspace navbar, and a scrollable page region that supports both a single wide column and a main + secondary panel layout.
- Render the sidebar with a 240px expanded / 72px collapsed width, brand + wordmark, flat nav in order (Overview, Transactions, Budgets, Loans, Goals), a separated **Add transaction** action, Settings near the bottom, and the account identity with menu.
- Render the navbar with breadcrumbs on the left (`aria-current="page"` on the current item) and route actions on the right; no global Share action.
- Make the sidebar responsive: persistent collapsible rail above 880px, off-canvas drawer with scrim at or below 880px, with exact breakpoint at 880/881px and no bottom tab bar.
- Provide one responsive overlay mechanism (sheet > 880px, bottom drawer ≤ 880px) with a header / scrolling body / pinned footer, used by Add transaction and the account menu.
- Drive all surface, border, and text colors from theme tokens; keep responsive CSS rules last so breakpoints win on equal specificity.
- Hold to 320px with no horizontal body scroll; keep interactive targets at 44x44 below 880px.
- Wire the stat grid (hidden on `/settings`) and the footer note that changes on `/settings`.

## Notes

- Spec: `context/feature/08-app-shell.md`. Reference image at `context/screenshoot/sample.png`.
- Shell files: `src/app/(app)/layout.tsx`, `src/components/layout/{Sidebar,Navbar,AccountMenu,ViewHeader,StatGrid}.tsx`, `src/components/shared/ResponsivePanel.tsx`, `src/hooks/use-media-query.ts`.
- Active nav uses `<Link>` + `usePathname()`; match route-segment boundaries (`/loans/[loanId]` activates Loans, `/goals` must not activate for `/overview`).
- View header strings follow the table (e.g. Loans: `1 loan · $X outstanding` / `N loans · $X outstanding` / `No loans tracked`), computed from page data and preferences.
- Footer note: `/settings` → "Settings apply when you save — everything else saves automatically."; elsewhere → "Saved automatically — only visible to you."
- Overlays lock body scroll and compensate for scrollbar width; Escape/scrim/close dismiss and return focus to the trigger; resizing across 880px switches shape without losing form state.
- Hover styling gated behind `@media (hover: hover) and (pointer: fine)`.
- Assert computed values (contrast ratios, resolved tokens, bounding boxes) rather than screenshots alone.

## History
