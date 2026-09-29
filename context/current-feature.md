# Current Feature: Overview

## Status
Not Started

## Goals
- Render five overview stat tiles in the specified order, with correct tones, compact values, and exact amounts in `title`.
- Show this month's expense categories and exactly six months of income-versus-expense trend data.
- Show the latest five transactions using the shared transaction row, with deletion available.
- Derive all figures from the same domain functions used by their feature pages; SQL-aggregate transaction totals and fold loan payments through the finance logic.
- Handle empty data, missing goals, zero goal targets, and loading/error states without layout shifts or invalid percentages.
- Remain usable at 320px, respond to theme changes without reload, and format KHR values correctly.

## Notes
- Spec: `context/feature/02-overview.md`.
- Overview is read-only and owns no tables or mutation actions; deleting a recent transaction uses the shared transaction behavior.
- The user's local month determines the current-month figures and long-form month label.
- The app layout owns the five stat tiles; the Overview page composes the charts and recent activity.
- `getOverview()` is cache-wrapped so the tiles, charts, and recent list share one execution. Chart category colors use stored slots and CSS variables.
- Debt must match the Loans page to the cent. Do not add date-range or month navigation.

## History
