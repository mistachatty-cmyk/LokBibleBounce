# LokBibleBounce MVP plan

**Status:** Proposed build specification; no application features are implemented yet.

**Product name:** LokBibleBounce; short name: LokBounce.
**First platform:** Windows desktop.

## Purpose and first-release boundary

LokBounce offers a respectful, low-distraction invitation to read the Bible. The book bounces on screen at user-chosen times or when opened manually. Clicking it reveals a random verse and an in-app view of that verse's full chapter. Lok identity is available for progress sync, but login is optional and unrelated Lok games or currency do not appear in the first release.

The full set of deferred requests and suggestions lives in [POST_MVP_IDEAS.md](POST_MVP_IDEAS.md). A deferred item is retained there rather than silently dropped.

## User experience

1. **First launch:** Choose WEB or KJV, optionally sign in with a Lok account, and optionally enable launch at startup and notifications. The app remains usable offline as a guest.
2. **Bounce:** A compact transparent book moves around the display containing the active app and reverses at display edges. It stays above ordinary desktop windows without blocking input outside its small footprint. Settings include a way to show, hide, or pause the bounce.
3. **Open:** Clicking the book stops the bounce and opens a readable verse view. The book opens with a short, restrained animation. A reference opens the full chapter in the app and highlights the selected verse. Reduced-motion settings remove the animation.
4. **Reminders:** Users choose a local time and days of the week. A due reminder bounces until opened, snoozed, or dismissed; after two minutes of no interaction it becomes a quiet pending reminder and Windows notification. Snooze defaults to ten minutes. A notification is also the fallback when an overlay cannot appear.
5. **Sessions:** Presets are 5, 10, 20, 30, 45, 60, 90, 120, and 180 minutes; custom goals accept 1–720 minutes. The timer counts only while active. Users can pause and resume while reading in the app, another app, or a physical Bible. On restart, an interrupted session returns paused. Each completed session saves its active duration; the app shows session history, lifetime reading time, completed sessions, and a simple streak.
6. **Customization:** WEB and KJV have distinct, respectful cover treatments. The inner reader stays consistent and legible. Translation choice controls both text and cover.

## Implementation direction

- Build with **Tauri 2 + React + TypeScript**, using Rust for the scheduler and overlay movement. Prototype the small always-on-top transparent window first. If it cannot meet smoothness and click-accuracy checks on the Windows test machines, switch to a transparent display-sized overlay and native hit handling before building the remaining UI.
- Bundle the two Bible texts locally from documented source editions. Normalize stable book, chapter, and verse IDs. Select random verses locally; no per-click network request or paid Bible API is needed.
- Keep schedules and guest progress in local app data. The tray process handles reminders while the reader is closed, recalculates after sleep/resume and clock changes, and avoids duplicate firing.
- Reuse the **same Supabase Auth project and user ID as LokBook**. Use the existing email magic-link template with a LokBounce desktop callback; do not change the shared email template. Sync reading sessions and chosen preferences on sign-in with stable session IDs and user-owned row-level policies. Reminder schedules stay device-local in this release. Store refresh credentials separately from ordinary settings; never ship a service-role key.
- Represent a completed session as a versioned domain event so future GSix/Lok adapters can consume it without changing the timer. There are no pet rewards or theological scores in the MVP.

## Acceptance checks

- Bounce and click remain accurate on one monitor, multiple monitors, mixed display scaling, browsers, ordinary apps, and a borderless game. Input outside the book reaches the underlying app. Record smoothness and resource use on target Windows hardware.
- A genuine exclusive-fullscreen case uses the notification fallback and is reported as a limitation, rather than claiming unsupported overlay coverage.
- Both translations work offline; a random verse opens the correct chapter and stays in the selected translation. The cover updates when the translation changes.
- Daily and weekday reminders behave correctly across snooze, dismissal, sleep/resume, restart, and daylight-saving changes without duplicate alarms.
- Paused time never increases a session's active duration. Restart recovery, session history, totals, and streaks match saved data.
- Guest use needs no account. Signing in uploads local sessions idempotently; account A cannot read or alter account B's data. Signing out leaves local reminders available.

## Release constraints

Start with Windows and borderless/windowed game support. The later requirement to appear over every game, including genuine exclusive fullscreen, is preserved as [idea O-01](POST_MVP_IDEAS.md#overlay-and-platforms). It requires separate feasibility, game-compatibility, performance, and anti-cheat review. Do not inject into game processes as a shortcut in the MVP.
