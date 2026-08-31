# Logo variations + dropdown mood picker

## 1. Logo variations to choose from

Keep the rounded-square app-icon shape from your upload, and produce 4 variants that all read well on light and dark headers. Each is generated as a transparent-friendly square PNG preview shown in chat — nothing in the app changes until you pick one.

- A — Pin + house + leaf (current mark), teal square, white mark. Refined edges and tighter optical centring.
- B — House + leaf only (no pin outline), deep ink-navy square with warm sand/cream mark. High contrast on both themes.
- C — Pin + roofline monogram "m", gradient teal-to-green square, white mark.
- D — Simple house-in-circle mark, near-black square with a bright mint mark for a neutral look in dark mode.

After you choose, that file becomes: header logo, `public/favicon.png`, and `app-icon-192/512.png` referenced by the manifest and apple-touch-icon.

## 2. Wall: mood/emoji picker becomes a dropdown

Today the composer shows a full inline panel: recent row, category row, and an 8-column emoji grid — roughly 5 rows of vertical space.

New behaviour:

- One compact trigger button in the composer showing the selected emoji (or a neutral face icon) plus a chevron and the "Mood" label.
- Tapping it opens a dropdown containing the same content: recent row, category tabs, scrollable emoji grid, and a "clear" option to remove the mood.
- Selecting an emoji sets it and closes the dropdown; recents keep working as they do now.
- Same for any other place the picker is used, so behaviour stays consistent.

## Technical notes

- `EmojiPicker.tsx` keeps its props (`value`, `onChange`, `label`) and its `EMOJI_GROUPS` data; the panel markup moves inside a shadcn `DropdownMenu` with the trigger styled like the existing `ColorPicker` trigger, so the Wall call site at `src/routes/index.tsx` is unchanged.
- Dropdown content constrained in width/height for a 393px screen, with the grid scrollable.
- Logo files are real files in `public/` (no CDN pointer) so the favicon and PWA icons resolve.
