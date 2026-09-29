# 07 — Settings

## Purpose

Profile, display currency, theme, second factor and data controls — and the one
place in the product where **nothing saves until you say so**. More behavior
lives on this page than on any other, most of it in the draft model.

---

## Routes & files

```
src/app/(app)/settings/page.tsx
src/features/settings/
  components/SettingsForm.tsx        'use client' — owns the draft
  components/ProfileCard.tsx
  components/CurrencyCard.tsx
  components/ThemeCard.tsx
  components/SecurityCard.tsx        delegates to features/auth
  components/DataCard.tsx
  components/SaveBar.tsx             sticky, appears when dirty
  actions.ts  queries.ts  schema.ts
src/hooks/use-draft.ts
src/lib/theme.ts                     accent derivation
```

## Data

```ts
preferences (
  userId primary key,
  currencyCode, customSymbol, decimals, position,
  themeAccent, themeBase, themeMode
)
users (name, email)                  -- profile
authenticators (...)                 -- spec 01
```

One `preferences` row per user, so a Save is one write.

## Validation

```ts
export const settingsSchema = z.object({
  name:         z.string().trim().max(40).optional(),
  email:        z.string().trim().email('Enter a valid email address').max(80).or(z.literal('')),
  currencyCode: z.enum(['USD', 'KHR', 'EUR', 'GBP']),
  customSymbol: z.string().max(4).optional(),
  themeAccent:  z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Enter a hex color'),
  themeBase:    z.enum(['cool', 'neutral', 'contrast']),
  themeMode:    z.enum(['system', 'light', 'dark']),
})
```

Email is **optional** here — the field is labeled *optional* — unlike sign-up,
where it is required (spec 01, R2).

## Server API

```ts
// actions.ts
saveSettings(prev, formData): ActionState   // one write, all cards
setCurrency(code): ActionState              // R8 — immediate, not drafted
clearAllData(prev, formData): ActionState   // R10
exportData(): Response                      // app/api/export/route.ts
```

`saveSettings` revalidates the whole `(app)` layout — currency and theme affect
every view.

## The draft model

Every control writes to a **draft**. Nothing touches stored state until **Save
changes**.

| Concern | Implementation |
|---|---|
| Draft store | `react-hook-form` `defaultValues` |
| Dirty check | `formState.dirtyFields` |
| Save bar copy | built from `dirtyFields` |
| Discard | `reset()` |
| Navigate away | route-change guard + `beforeunload` |

### Rules

- **R1.** No control on this page writes on change. Save is the only write.
- **R2.** The sticky save bar appears when the form is dirty and names **which**
  groups changed, pluralized: `Unsaved name change` / `Unsaved name, theme
  changes`. A bare "You have unsaved changes" makes people hunt for what they
  touched.
- **R3.** **Theme previews live while pending.** Changing the accent repaints
  immediately, but stores nothing. Reload, Discard, or navigating away all
  restore the saved theme. This is the subtlest behavior on the page — you
  cannot choose a color you cannot see, but previewing must not be a write.
- **R4.** Discard reverts every card at once, including the live theme preview.
- **R5.** The save bar must clear the content beneath it at rest **and**
  mid-scroll — the last card carries bottom padding equal to the bar's height.
- **R6.** The dashboard **stat tiles are hidden on Settings**. They are noise on
  a preferences page.
- **R7.** The footer note on this page reads: *"Settings apply when you save —
  everything else saves automatically."*

### The two deliberate exceptions

- **R8.** The **account menu's currency switch is immediate.** It is a
  quick-switch in the menu, not a Settings control, and it writes on click. The
  Settings currency card is drafted; the menu is not. This is intentional — the
  quick-switch exists precisely to be quick — and it is not an inconsistency to
  tidy up.
- **R9.** **Clear all data is immediate.** It is an action, not a preference, so
  it is outside the draft and Save does not apply it.

## Cards

### Profile
*The name and initials shown on your avatar.* Avatar preview (initials), display
name (max 40), email (optional, max 80). Initials update live with the draft.

### Display currency
*Applies to every amount in Coffer.* The four currencies in their fixed order,
plus *Or use a custom symbol* (max 4 characters). A custom symbol overrides the
preset's symbol only — decimals and position are unchanged (conventions §2).

### Theme

- **Accent** — presets plus a custom hex. `--accent-strong`, `--accent-deep`,
  `--accent-soft`, `--accent-line`, `--accent-ink` and `--accent-text` are all
  derived from it in `lib/theme.ts`.
- **Base** — `cool` | `neutral` | `contrast`, each with light and dark variants.
- **Mode** — `system` | `light` | `dark`. On `system`, a `matchMedia` listener
  tracks the OS live.

- **R11.** Text *on* the accent and the accent *as* text are chosen by
  **measured WCAG contrast**, not a luminance threshold. The threshold shortcut
  is what makes mid-tone accents illegible, and it is unit-tested.
- **R12.** Both modes' muted text must clear **4.5:1** against every base tone,
  at the smallest size the token is used.
- **R13.** `:root` holds the dark values as the default paint, so the page
  renders correctly before hydration.

### Security
Two-factor enrollment, QR, and disable-requires-a-code — all specified in
[spec 01](01-auth-and-onboarding.md), R8–R12. This card is the entry point only.

### Data
*Everything here belongs to your account and is visible only to you.*

- **R10.** **Clear all data** wipes every transaction, budget, loan and goal. It
  takes a two-tap confirm (the button becomes a confirm state on the first tap),
  runs in one database transaction, and does **not** delete the account, the
  profile or the preferences.
- **R14.** **Export** — download the ledger as JSON or CSV via
  `app/api/export/route.ts`. A server-held ledger needs a way out, or the data
  is only nominally the user's.

## States

| State | Behavior |
|---|---|
| Pristine | no save bar |
| Dirty | sticky bar naming the changed groups; Save + Discard |
| Saving | both buttons disabled; theme preview stays as previewed |
| Save failed | bar stays, error toast, draft preserved |
| Navigating away while dirty | confirm; leaving reverts (R3) |
| Clear all data, first tap | button becomes the confirm state |

## Acceptance criteria

- [ ] Changing the accent repaints instantly; reloading without saving restores
      the previous accent (R3)
- [ ] Discard reverts every card including the live theme preview (R4)
- [ ] Navigating away while dirty confirms, and leaving reverts
- [ ] The save bar names the changed groups with correct plurals (R2)
- [ ] The save bar clears the content beneath it at rest and mid-scroll (R5)
- [ ] `system` mode follows an OS light/dark switch live, with no reload
- [ ] The account-menu currency switch persists **without** Save (R8)
- [ ] Stat tiles are absent on Settings and present on every other view (R6)
- [ ] Clear all data empties the four collections and leaves profile,
      preferences and the second factor intact (R10)
- [ ] Every derived accent token clears 4.5:1 for a mid-tone accent such as
      `#7a8b3c` (R11, unit)
- [ ] Export round-trips: the CSV contains every transaction in the ledger

## Out of scope

Notification preferences, locale/number formatting independent of currency,
account deletion, device/session management, data import.
