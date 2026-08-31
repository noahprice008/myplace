# Fixes: workplace colours, logo, header layout, full translation

## 1. Workplace colours on the schedule

- When adding or editing a workplace (Work tab), add a colour picker: a row of ~10 preset swatches. Workplace 1 defaults to blue; each new workplace gets the next unused preset.
- Store the chosen colour on the workplace record.
- The schedule grid stops using the fixed "Workplace 1 / Workplace 2" labels and instead lists the user's real workplaces by name, painted in their colour.
- Personal, Other and Unavailable also get editable colours, chosen from the same swatch row in a small "Colours" control on the Schedule page, saved on-device.
- Existing saved slots keep working: old `workplace1` / `workplace2` entries map to the first and second workplace.

## 2. Logo

Regenerate the mark as a rounded-square icon with no outer white circle, and tune its colours so it stays high-contrast on both light and dark headers. The same file updates the favicon and installed-app icon.

## 3. Header layout

Restructure the header into three zones:

```text
[ logo ]        PAGE TITLE        [ mode ] [ lang ] [ ⭐ ]
                 subtitle
```

- Page title centred, larger and bolder — the focal point.
- Upgrade becomes a small round icon button (crown), matching the mode and language buttons; the "Pro" state is shown by its colour rather than a text label.
- Ensure every page passes a clear title, and that titles stay readable at 393px width.

## 4. Language applies to the whole app

Currently only the bottom nav and quick-add use translation keys; page titles, headings, buttons, form labels, empty states and toasts are hard-coded English. Fix by:

- Extending the dictionary with keys for all visible UI text across Wall, Work, Cash, Diary, Schedule, the header, Quick-Add, Upgrade dialog and shared components.
- Replacing every hard-coded user-facing string in those files with `t("...")`.
- Translating the new keys into all 20 languages already supported.
- Page titles/subtitles passed to the header come from translation keys too, so switching language changes the whole screen.
- User-entered content (post text, workplace names, notes) is never translated.

## Technical notes

- `Workplace` gains `color`; a new `useSlotColors` persisted map holds personal/other/unavailable colours. Colours are semantic tokens defined in `src/styles.css` (extend the existing `--job-*` set into a numbered palette) so light/dark both work.
- `JOBS` in `src/routes/schedule.tsx` becomes derived from workplaces + the three fixed slot kinds.
- i18n stays the in-repo dictionary in `src/lib/i18n.tsx`; the `TKey` union grows, and `make()` arrays are extended in the same key order.
