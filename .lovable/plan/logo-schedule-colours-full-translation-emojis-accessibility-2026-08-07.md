# Logo, schedule colours, full translation, emojis, accessibility, pricing

## 1. Logo & favicon (previews first)

The uploaded mark is a teal rounded-square with a white pin + house + leaf. Before replacing anything, I'll produce 3 transparent-background variants from it and show them in chat:

- A: pin/house/leaf mark alone, teal on transparent (no square, no white).
- B: same mark inside the rounded teal square, transparent outside the square.
- C: mark recoloured to the app's brand teal token for tighter match with the header.

You pick one, then it becomes: header logo, `favicon.png`, `app-icon-192/512.png` (manifest + apple-touch-icon). Nothing changes until you choose.

## 2. Schedule: slot colours as a dropdown

Replace the swatch rows on the Schedule page with a compact dropdown per slot kind (Personal / Other / Unavailable): a small round colour dot as the trigger, opening a menu of the 10 palette colours with names. Same for the workplace colour field in Work. Saves roughly 3 rows of vertical space.

## 3. Language integration — make it complete

Audit every route and component for hard-coded English and route it through the dictionary:

- Remaining literals: toasts ("Backup restored", "That file isn't a myplace backup"), Upgrade dialog copy, Wall composer/post-type labels, Cashflow and Calendar labels, empty states, EventCard type labels, ColorPicker/colour names.
- Dates and times: switch every `toLocaleDateString` / `toLocaleTimeString` / weekday and month name to the active language's locale instead of the browser default, including the schedule day headers and the calendar.
- Numbers/currency: format with the active locale.
- RTL: verify Hebrew/Arabic/Urdu flip correctly on all pages (header, schedule grid, cards).
- All new keys translated into the 20 existing languages. User-entered content is never translated.

## 4. Language button — options

I'll show 3 variants of the language control and you pick:

- A: current globe icon, but with the 2-letter code badge (e.g. `EN`).
- B: flag-free pill showing the code as text (`EN ▾`).
- C: icon button that opens a full-screen searchable language sheet (better for 20 languages on a 393px screen).

## 5. Wall emojis

Expand the mood row from 10 to a categorised picker: moods, energy, love, work, food, travel, weather, celebration — around 60 emojis in a scrollable grid with a "recent" row, still one-tap to attach.

## 6. Suggested features (pick any, not built by default)

- Search across posts, shifts, expenses and appointments.
- Streaks / weekly summary card on the Wall ("you logged 5 days, earned X").
- Recurring shifts and appointments.
- Budget targets per category with progress bars in Cashflow.
- Invoice PDF from billable workplaces.
- Reminders/notifications for upcoming appointments.
- Optional PIN/biometric lock, since everything is local.
- Optional cloud sync + login so data survives a lost phone.

## 7. Suggested UI/UX improvements (pick any)

- Pull-to-refresh-free but add swipe between the 5 tabs.
- Skeleton/empty-state illustrations instead of plain text.
- Larger tap targets on the schedule grid and a drag-to-paint gesture for filling several hours.
- Undo toast on delete instead of confirm dialogs.
- Month view for the calendar with dots per day.
- Sticky totals bar in Work and Cashflow.
- Haptic tap feedback on mobile.

## 8. Accessibility button

New round icon button in the header opening an accessibility sheet, with settings persisted on-device:

- Text size (normal / large / extra large).
- High contrast mode.
- Reduce motion.
- Underline links / bolder text.
- Larger tap targets.

Plus a pass on the app: labels on every icon-only button, visible focus rings, correct heading order, and one `<main>` landmark.

## 9. Pricing

Upgrade dialog becomes a single plan: **$2.49 / month**. Yearly option and the two-card grid are removed; the Pro badge and cancel flow stay.

## Technical notes

- Logo variants generated with the image tools from the upload, background removed; favicon and app icons are real files in `public/`.
- Colour dropdown = shadcn `DropdownMenu` wrapper replacing `ColorPicker`'s swatch row, same `SlotColorId` values, no data migration.
- i18n: extend `TKey` and every `make()` array in `src/lib/i18n.tsx`; add a `useLocale()` helper mapping `LangCode` to a BCP-47 tag used by all date/number formatting.
- Accessibility settings stored via `usePersistentState`, applied as `data-*` attributes on `<html>` with token overrides in `src/styles.css`.
- `PLANS` in `UpgradeDialog.tsx` collapses to one entry; `ProPlan` keeps `monthly` only alongside `free`.
