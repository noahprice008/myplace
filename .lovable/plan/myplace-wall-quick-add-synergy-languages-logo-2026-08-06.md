# myplace — Wall, Quick-Add, Synergy, Languages & Logo

Everything stays on-device (localStorage), no accounts, no backend.

## A. Wall upgrades

**Auto timeline cards.** When something happens in another tab, the Wall gets a compact, visually distinct "event card" — different styling from your own posts, with an icon and a tap-to-jump link to the source tab:

- Work: shift logged, workplace added, big earning day
- Cash: expense logged, fixed cost added, monthly budget crossed
- Diary: appointment added for a future date
- Hours: week schedule locked / hours filled

Event cards can be hidden with a filter chip ("Mine" / "All"), and deleted individually. They are generated when the event is recorded, not retroactively.

**Rich media & micro-journaling.**
- Photos: already supported; add multi-photo picking and a compact grid.
- Voice memos: record straight in the composer (mic button), stored as compressed audio on-device, played back inline with a waveform-style bar and duration.
- Mood stickers: a one-tap row of moods/reactions that can post on their own ("mood snapshot") or attach to a post.

## B. Global quick-add

A floating **+** button on every tab, bottom-right above the nav bar. Tapping it opens a fast sheet with four one-tap targets:

```text
[ Thought ]  [ Expense ]
[ Hours   ]  [ Task/List ]
```

Each opens a minimal single-field form (text / amount / hours) with sensible defaults (today, last-used workplace, last-used category) so an entry takes one tap plus one field. Saving writes to the right tab's data and drops an event card on the Wall.

## C. Hours → Cash synergy

- Workplaces get an optional "freelance / billable" flag with a rate.
- The Work tab shows, per period, **billable hours → expected income**, using each workplace's rate plus extra-minute billing already in the app.
- One tap "Send to Cash" turns a period's billable total into an income entry in the Cash tab, so cashflow reflects earned-but-not-yet-paid work. Cash gains a simple income list alongside expenses so the balance is real.
- A small "Invoice summary" view lists the period's shifts, hours, rate and total, printable/shareable with the existing share helper.

## D. Language selector

A language button in the header (globe icon) with the 20 most widely used languages, including Hebrew. Default English; choice saved on-device. Hebrew and Arabic switch the whole app to right-to-left layout. All app text moves into per-language dictionaries; user-entered content is never translated.

Languages: English, Hebrew, Arabic, Spanish, Portuguese, French, German, Italian, Russian, Turkish, Polish, Dutch, Chinese (Simplified), Japanese, Korean, Hindi, Bengali, Urdu, Indonesian, Vietnamese.

## E. Logo refresh

Rework the myplace mark so it reads clearly at small sizes: stronger silhouette, higher contrast against both light and dark headers, slightly larger header placement with a subtle ring. The same mark becomes the favicon and the installed-app icon.

## Installable app (instead of native widgets)

Android home-screen widgets and Google Drive sync need a native Android build, which a web app cannot do. Web-possible equivalents now:

- **Install to home screen**: app manifest, icons, name and theme colour so myplace opens full-screen like an app.
- **Backup file**: "Export my data" produces a single file you can save to Google Drive yourself, and "Import" restores it on any device.

Native widgets and automatic Drive sync stay on the list for a future Android packaging step.

## Technical notes

- New store hooks: `useEvents` (Wall event cards), `useIncome`, `useLanguage`; workplaces gain `billable`/`invoiceRate`.
- Event creation goes through one shared `logEvent()` helper called from Work, Cash, Diary and Hours mutations, so there is a single source of truth.
- Voice memos recorded with `MediaRecorder`, stored as base64 in localStorage with a duration cap and size guard to avoid quota errors.
- i18n via a lightweight in-repo dictionary + `useT()` hook (no heavy library); `dir="rtl"` toggled on the document element.
- Quick-add lives in `AppShell` so it appears on all routes.
