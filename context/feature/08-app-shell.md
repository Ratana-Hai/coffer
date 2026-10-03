# 08 — App Shell: Layout, Navbar & Sidebar

## Purpose

The persistent application chrome: a left navigation sidebar, a breadcrumb
navbar, the page-content region, stat tiles, account menu, and responsive
overlay panels. This spec is normative for shell geometry and navigation.

The reference establishes the visual hierarchy and proportions. Use Coffer's
routes, content, design tokens, and accessibility requirements; do not copy the
reference product's brand, course content, integrations, or blue decorative
backdrop.

## Reference image

![Reference design for the app layout, navbar, and sidebar](../screenshoot/sample.png)

The image is stored at `context/screenshoot/sample.png` (directory spelling is
intentional in the current workspace). It shows a dark left sidebar with a
brand, expandable navigation, a bottom account identity, and a light workspace
with a breadcrumb/action bar. The detailed cards in the reference are examples
of page content, not shell requirements.

## Routes & files

```text
src/app/(app)/layout.tsx               sidebar + navbar + page slot + <Toaster>
src/components/layout/
  Sidebar.tsx                           desktop navigation + mobile drawer
  Navbar.tsx                            breadcrumbs + page actions
  AccountMenu.tsx                       'use client' — profile actions
  ViewHeader.tsx                        page title + period summary
  StatGrid.tsx                          hidden on /settings
src/components/shared/ResponsivePanel.tsx
src/hooks/use-media-query.ts
src/app/globals.css                     tokens, components, responsive rules last
```

## Layout

The shell fills the viewport. At desktop widths it is a two-column frame: a
fixed-width sidebar on the left and a flexible workspace on the right. The
workspace contains a top navbar and a scrollable page region. The page region
owns its own content grid; the shell must support both a single wide column and
feature pages with a main column plus a secondary panel.

| Element | Desktop behavior |
|---|---|
| Sidebar | Persistent left rail, 240px expanded and 72px collapsed |
| Workspace | `min-width: 0`; takes the remaining viewport width |
| Navbar | Stays at the top of the workspace while page content scrolls |
| Page region | Scrolls independently; content is padded and may define its own columns |

The screenshot's outer blue frame and patterned backdrop are not part of the
product shell. Surface and text colors come from CSS theme tokens so the layout
continues to work in light/dark mode and across all base tones.

## Sidebar

The sidebar uses a deep, high-contrast surface distinct from the workspace. Its
vertical regions are:

1. Brand mark and **Coffer** wordmark at the top.
2. Primary navigation in this order: **Overview, Transactions, Budgets, Loans,
   Goals**.
3. A prominent **Add transaction** action, separated from route navigation.
4. **Settings** as a utility destination near the bottom.
5. Account identity at the bottom: avatar, display name, and a disclosure
   control that opens the account menu.

Navigation rows have an icon and text label. The active route has a persistent
selected treatment; color is not the only active-state signal. The sidebar may
support expandable groups for routes with real child destinations, but Coffer's
v1 primary items remain flat. Do not invent nested destinations to imitate the
reference's Education menu.

A circular collapse control sits on the sidebar's workspace edge, aligned near
the top. Expanded mode shows icons and labels; collapsed mode shows icons only
and exposes each item's full name through an accessible label and tooltip.
Collapsing the sidebar must resize the workspace without overlaying or shifting
its content horizontally.

## Navbar

The navbar spans the workspace, not the sidebar. It has two aligned regions:

- **Left:** breadcrumb trail from the app section to the current page. The
  current page is plain text; ancestors are links. Use `aria-current="page"` on
  the current breadcrumb when represented as a link in responsive variants.
- **Right:** actions supplied by the current route, followed by an overflow
  menu when needed. Keep actions aligned to the right and prevent long
  breadcrumbs from pushing them off-screen.

Do not add a global Share action: Coffer has no sharing feature. The workspace
navbar is for location and page-level actions; page headings and period summaries
remain in `ViewHeader` below it.

## Navigation and page header content

Use `<Link>` for route navigation and `usePathname()` for the active state. Match
the exact route or a route-segment boundary; `/loans/123` activates Loans, but
`/goals` must not appear active for `/overview`.

| Route | Title | Period / summary |
|---|---|---|
| `/overview` | Overview | `September 2025` |
| `/transactions` | Transactions | `1 entry logged` / `N entries logged` |
| `/budgets` | Budgets | `September 2025 · N of 8 categories budgeted` |
| `/loans` | Loans | `1 loan · $X outstanding` / `N loans · $X outstanding` / `No loans tracked` |
| `/goals` | Savings goals | `1 active goal` / `N active goals` |
| `/settings` | Settings | `Profile, currency and data` |

All dates, amounts, counts, and plural forms are computed from page data and the
user's preferences; the examples above are format examples, not hard-coded
values.

The shell footer note appears below page content:

- On `/settings`: *"Settings apply when you save — everything else saves
  automatically."*
- Everywhere else: *"Saved automatically — only visible to you."*

## Responsive behavior

| Width | Sidebar | Navbar |
|---|---|---|
| `> 880px` | Persistent, collapsible left rail | Breadcrumbs and route actions side by side |
| `<= 880px` | Hidden off-canvas drawer opened by the menu button | Menu button, compact breadcrumb, route actions |

The breakpoint is exact; test at 880px and 881px. The mobile drawer covers the
workspace and uses a scrim. Selecting a route closes it. At narrow widths,
collapse ancestor breadcrumbs before hiding the current page label or clipping
actions. No bottom tab bar is used in this layout.

At 320px, the workspace has no horizontal body overflow. Wide feature content,
such as an amortization schedule, scrolls inside its own container. All
interactive targets meet the 44x44 CSS-pixel minimum below 880px.

## Responsive overlay panels

Forms use one mechanism with two shapes:

| Width | Shape | shadcn primitive |
|---|---|---|
| `> 880px` | Right-hand drawer | `sheet` |
| `<= 880px` | Bottom sheet | `drawer` (Vaul) |

Both shapes use a **header / scrolling body / pinned footer** layout. The
Add transaction action uses this panel. Add-loan and new-goal actions use it
where specified by their feature specs.

Opening a panel or mobile sidebar locks body scrolling and compensates for the
scrollbar width so the workspace does not shift sideways. Escape, the scrim,
and the close control dismiss overlays; focus is trapped while open and returns
to the trigger on close. Resizing across 880px while a form is open changes the
panel shape without losing entered values.

## Account menu and stat grid

The account menu opens from the profile control at the bottom of the sidebar.
In order it contains the account head (avatar, display name, *Personal ledger*),
the immediate **Display currency** quick-switch, a divider, and **Lock now**
(hidden when no second factor is enrolled). Settings is a sidebar destination,
not a duplicate menu item.

The avatar initials derive from the display name and update live with the
Settings draft. The stat grid is hidden on `/settings` and shown on every other
view (spec 07, R6).

## Rules

- **R1.** The desktop shell is a persistent left sidebar beside a flexible
  workspace. The workspace must have `min-width: 0` so long content cannot force
  the sidebar off-screen.
- **R2.** The sidebar is 240px expanded and 72px collapsed above 880px. The
  collapse control is keyboard-operable and has an accessible name describing
  the action it will perform.
- **R3.** At `<= 880px`, the sidebar becomes an off-canvas drawer; at 881px it is
  part of the desktop layout. No bottom tab bar is rendered.
- **R4.** The navbar contains breadcrumbs on the left and route actions on the
  right. Breadcrumb truncation must not make route actions unreachable.
- **R5.** Opening an overlay locks body scroll and compensates for scrollbar
  width; the page must not shift horizontally.
- **R6.** The stat grid is hidden on `/settings` and shown on every other view.
- **R7.** Panel footers are pinned while panel bodies scroll.
- **R8.** Scrim, Escape, and close controls dismiss overlays; focus returns to
  the control that opened them.
- **R9.** Hover styling is gated behind
  `@media (hover: hover) and (pointer: fine)`.
- **R10.** The layout holds to 320px with no horizontal body scroll. Wide tables
  and schedules scroll within their own containers.
- **R11.** The account menu uses the responsive overlay mechanism.
- **R12.** Avatar initials follow the display name and update live with the
  Settings draft.
- **R13.** Use theme tokens for sidebar, workspace, borders, and text; no
  component hard-codes color values.
- **R14.** Responsive CSS rules stay last in the stylesheet so equal-specificity
  breakpoint rules win predictably.

## States

| State | Behavior |
|---|---|
| Route transition | Shell persists; only the page area suspends |
| Sidebar collapsed | Workspace expands; nav labels remain available to assistive technology |
| Mobile sidebar open | Scrim is visible, body is locked, focus stays in the drawer |
| Overlay open, resize across 880px | Shape switches without losing form state |
| Slow query | `loading.tsx` renders inside the workspace; sidebar and navbar remain interactive |
| Offline / action failure | Toast via `sonner`; the shell never unmounts |

## Acceptance criteria

- [ ] The spec renders the reference image from `context/screenshoot/sample.png`.
- [ ] At 1440px, the sidebar is persistent and the workspace fills the remaining width.
- [ ] Collapsing the desktop sidebar changes its width from 240px to 72px without covering content.
- [ ] At 880px the sidebar is off-canvas; at 881px it is in the desktop layout.
- [ ] Opening the mobile sidebar shows a scrim, locks body scroll, and traps focus.
- [ ] Escape, scrim, close control, and route selection close the mobile sidebar; focus returns appropriately.
- [ ] Breadcrumbs and route actions remain usable at 320px without horizontal body scrolling.
- [ ] Correct route highlighting works on `/loans/[loanId]` and does not match unrelated route prefixes.
- [ ] The Add transaction action is available from the sidebar and opens the responsive panel.
- [ ] Opening any panel does not shift the workspace horizontally; its footer stays pinned while its body scrolls.
- [ ] No hover state persists after a tap on a touch device.
- [ ] View header strings use the table's formats and correct plural forms.
- [ ] The footer note changes on `/settings`; the stat grid is absent there and present elsewhere.
- [ ] Sidebar and workspace colors use theme tokens and pass the shared contrast requirements in light and dark modes.

## Out of scope

- Growly branding, course-detail cards, charts, team assignment overlays, and
  third-party integration links shown in the reference image.
- Sharing and any global share action.
- A bottom navigation tab bar.

## Note on testing this

Assert **computed values** — contrast ratios, resolved tokens, and bounding
boxes — rather than comparing screenshots alone. In particular, verify sidebar
widths and placement, navbar action visibility, mobile drawer geometry, and the
absence of horizontal overflow at 320px.
