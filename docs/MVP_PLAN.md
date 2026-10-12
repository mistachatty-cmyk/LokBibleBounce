# LokBibleBounce MVP plan

**Status:** MVP specification. Implementation is underway; see [implementation notes](IMPLEMENTATION.md) for verified progress and remaining checks.

**Product name:** LokBibleBounce; short name: LokBounce.
**First platform:** Windows desktop.

## Purpose and first-release boundary

LokBounce offers a respectful, low-distraction invitation to read the Bible. When the desktop app is running, the Bible rests in a chosen corner over the desktop and ordinary apps. Activating it or a user-chosen reminder starts the bounce. Clicking it reveals a compact book menu; **Open Bible & read** opens the full reader and focuses a random verse. Lok identity is available for progress sync, but login is optional and unrelated Lok games or currency do not appear in the first release.

The full set of deferred requests and suggestions lives in [POST_MVP_IDEAS.md](POST_MVP_IDEAS.md). A deferred item is retained there rather than silently dropped.

## User experience

1. **First launch:** The desktop app opens as a still Bible in the bottom-right corner, without showing its full reader window. It sits inside the usable desktop area above the taskbar. Its default size adapts to that area's height; Small, Medium, and Large are optional. Users can choose any corner or hide it until triggered. Choose WEB or KJV and optional Lok sign-in after opening the reader. Launch at Windows startup remains opt-in; the app works offline as a guest.
2. **Bounce:** The Bible moves only after **Bounce now** or a reminder. A compact transparent book reflects at display edges; impact animation shows edge contact. It stays above ordinary desktop windows without blocking input outside its small window footprint. Hover pauses movement for clicking. The tray can start a bounce or return the Bible to its corner.
3. **Open:** Clicking the book stops its movement and opens a compact menu attached to the book. **Open Bible & read** shows the readable two-page Bible spread with a random verse in focus. A reference opens the full chapter and highlights the selected verse. Reduced-motion settings remove the opening animation. Closing the reader returns the Bible to its resting mode.
4. **Reminders:** Users choose a local time and days of the week. A due reminder bounces until opened, snoozed, or dismissed; after two minutes of no interaction it closes and sends a quiet Windows notification. Snooze defaults to ten minutes. A notification is also the fallback when an overlay cannot appear.
5. **Sessions:** Presets are 5, 10, 20, 30, 45, 60, 90, 120, and 180 minutes; custom goals accept 1–720 minutes. The timer counts only while active. Users can pause and resume while reading in the app, another app, or a physical Bible. On restart, an interrupted session returns paused. Each completed session saves its active duration; the app shows session history, lifetime reading time, completed sessions, and a simple streak.
6. **Customization:** WEB and KJV have distinct, respectful cover treatments. The inner reader stays consistent and legible. Translation choice controls both text and cover.

## Implementation direction

- Build with **Tauri 2 + React + TypeScript**, using Rust for the scheduler and overlay movement. Prototype the small always-on-top transparent window first. If it cannot meet smoothness and click-accuracy checks on the Windows test machines, switch to a transparent display-sized overlay and native hit handling before building the remaining UI.
- Bundle the two Bible texts locally from documented source editions. Normalize stable book, chapter, and verse IDs. Select random verses locally; no per-click network request or paid Bible API is needed.
- Keep schedules and guest progress in local app data. The tray process handles reminders while the reader is closed, recalculates after sleep/resume and clock changes, and avoids duplicate firing.
- Reuse the **same Supabase Auth project and user ID as LokBook**. Use the existing email magic-link template with a LokBounce desktop callback; do not change the shared email template. Sync reading sessions and chosen preferences on sign-in with stable session IDs and user-owned row-level policies. Reminder schedules stay device-local in this release. Store refresh credentials separately from ordinary settings; never ship a service-role key.
- Give completed sessions stable IDs and fields that can map to a [versioned domain event](ECOSYSTEM_INTEGRATION.md) when future GSix/Lok adapters are defined. There are no pet rewards or theological scores in the MVP.

## Acceptance checks

- Bounce and click remain accurate on one monitor, multiple monitors, mixed display scaling, browsers, ordinary apps, and a borderless game. Input outside the book reaches the underlying app. Record smoothness and resource use on target Windows hardware.
- A genuine exclusive-fullscreen case uses the notification fallback and is reported as a limitation, rather than claiming unsupported overlay coverage.
- Both translations work offline; a random verse opens the correct chapter and stays in the selected translation. The cover updates when the translation changes.
- Daily and weekday reminders behave correctly across snooze, dismissal, sleep/resume, restart, and daylight-saving changes without duplicate alarms.
- Paused time never increases a session's active duration. Restart recovery, session history, totals, and streaks match saved data.
- Guest use needs no account. Signing in uploads local sessions idempotently; account A cannot read or alter account B's data. Signing out leaves local reminders available.

## Release constraints

Start with Windows and borderless/windowed game support. The later requirement to appear over every game, including genuine exclusive fullscreen, is preserved as [idea O-01](POST_MVP_IDEAS.md#overlay-and-platforms). It requires separate feasibility, game-compatibility, performance, and anti-cheat review. Do not inject into game processes as a shortcut in the MVP.
