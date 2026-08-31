# Cashflow, Sharing, Upgrade & Mobile Polish

## 1. New Cashflow page

A fifth tab (`/cashflow`) with a clean income-and-expenditure statement.

- **Income** — pulled automatically from the Work page shifts (per workplace, per period). Read-only, with a link back to Work.
- **Fixed costs** — recurring monthly items (rent, electricity, insurance…). Add / edit / delete any item; name, amount and category are all editable, so nothing is hard-coded.
- **Daily purchases & expenses** — one-off entries with date, name, amount and category.
- **Custom categories** — the user can add or rename categories used by both cost lists.
- **Statement view** — period selector (month / year, with back-forward arrows) showing:
  - Total income, total fixed costs, total variable expenses
  - Net cashflow with a positive/negative highlight
  - Category breakdown with share bars
  - Line-by-line table of every entry in the period
- **Export button** — CSV download of the period's rows, plus a "Print / Save as PDF" option that opens a clean printable statement.

Data is stored locally alongside existing app data (same mechanism as posts, shifts and appointments).

## 2. Wall: working social share

The share button on each post gets a small menu:

- Facebook, X/Twitter, WhatsApp, Telegram, LinkedIn, Email
- Copy link / copy text
- Native device share sheet stays as the first option on phones that support it

Post text is used as the share message; images stay in the app (link-based sharing).

## 3. Upgrade button

- An **Upgrade** entry in the header opens a Pro plan screen listing the plan tiers and what Pro will unlock.
- A **mock checkout** flow: pick a plan, confirm on a simulated payment screen, and the app records a Pro status locally so premium states can be built and tested. Clearly marked as a demo, with a "Manage / cancel" toggle for testing.
- Groundwork for locking: a single `isPro` check that any feature can be gated with later. No existing feature is locked in this step.
- Real payments (Stripe or Paddle) can be swapped in later without changing the UI.

## 4. Mobile optimisation

Pass over all pages:

- Header rows converted to the safe grid pattern so titles truncate instead of clipping
- Larger tap targets on the schedule grid, tab bar and action buttons
- Horizontal scroll containers for the schedule and cashflow tables
- Bottom-nav grows to five tabs with tighter labels/icons so it still fits small screens
- Dialogs and composers become full-height sheets on phones
- Safe-area padding respected top and bottom

## Technical notes

- New route `src/routes/cashflow.tsx` with its own `head()` metadata; nav entry added in `src/components/AppShell.tsx`.
- New store types and hooks in `src/lib/store.ts`: `FixedCost`, `Expense`, `ExpenseCategory`, `useFixedCosts`, `useExpenses`, `useCategories`, `useProStatus` — all via existing `usePersistentState`.
- Income derives from existing `shifts` + `workplaces`; no change to the Work data model. All amounts use the existing `useMoney` currency formatter.
- CSV built client-side as a Blob download; PDF via a print-only stylesheet (`@media print`) on the statement section.
- Share links built as provider intent URLs (`facebook.com/sharer`, `wa.me`, etc.) in a small `src/lib/share.ts` helper, with `navigator.share` preferred when available.
- Upgrade UI in `src/components/UpgradeDialog.tsx` plus a `useProStatus` hook; mock checkout only, no backend.
