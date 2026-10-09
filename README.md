# LokBibleBounce

**LokBounce** is a Bible-focused Windows desktop companion. A small Bible bounces across the screen as a gentle invitation to read. Click it to open a random verse and its chapter. Scheduled reminders and reading sessions help make space for reading without turning faith into a competition.

> **Status:** MVP implementation in progress. The web UI builds and its core data tests pass. The Windows installer and native overlay still require CI and hands-on Windows verification before a release.

## Current MVP scope

- Windows desktop app that launches as a single bouncing Bible on the active display, over ordinary apps, browsers, and compatible borderless/windowed games. Click the book to open the reader; close the reader to return to the passive bounce.
- Offline World English Bible (WEB) and King James Version (KJV), with a random verse, full chapter view, and a cover that follows the chosen translation.
- Daily or selected-weekday reminders with open, snooze, and dismiss actions.
- Reading timers from 5 minutes to 3 hours, plus a custom goal; pause/resume, saved session history, lifetime reading time, and a simple streak.
- Optional login using the existing LokBook Supabase identity; the Bible, reminders, and guest progress work offline.

The overlay may not appear over a genuine exclusive-fullscreen game. That remains an explicit future goal, with a notification fallback for the first release.

The desktop bounce runs while LokBounce is open, including when its reader is hidden in the tray. Use the tray menu to pause or resume it. **Launch with Windows** is optional in Settings. This is a desktop overlay, not a Windows idle `.scr` screensaver or lock-screen app; a separate idle screensaver mode is recorded in [post-MVP ideas](docs/POST_MVP_IDEAS.md).

## Run locally

Requires Node.js 24 and npm. For a Windows desktop build, install Rust (MSVC toolchain), Visual Studio C++ Build Tools with Windows SDK, and WebView2. The Windows CI workflow builds an NSIS installer on GitHub's runner.

```powershell
npm ci
npm test
npm run build
npm run tauri:dev
```

`npm run dev` opens a browser preview of the UI. Only the Tauri build can place the book over other applications or run reminders from the tray. The two 66-book Bible datasets are checked in and work offline. To regenerate them from the pinned eBible source archives, run `npm run bible:import` (see [research notes](docs/RESEARCH_NOTES.md)).

Guest reading and reminders need no account. Lok account sign-in uses the shared LokBook Supabase project, but session sync requires the [user-owned table migration](supabase/migrations/202610080001_lok_bible_sessions.sql) and the `lokbounce://auth/callback` redirect to be allowed in Supabase Auth. Do not apply the migration to a different project.

## Planning documents

- [MVP plan](docs/MVP_PLAN.md) — agreed first-release behavior, architecture, and acceptance checks.
- [Post-MVP ideas](docs/POST_MVP_IDEAS.md) — retained ideas from the conversation and additional possibilities. **This is the place to add anything deferred.**
- [Research notes](docs/RESEARCH_NOTES.md) — evaluated tools, costs, source material, and the earlier Gemini proposal.
- [Implementation notes](docs/IMPLEMENTATION.md) — current architecture, build and verification status, and remaining release checks.
- [Motion spec](docs/MOTION_SPEC.md) — bounce physics, edge reactions, opening animation, and Windows quality checks.
- [Bible content provenance](docs/CONTENT_PROVENANCE.md) — source editions, reproducible checksums, and release review notes.
- [Lok ecosystem integration](docs/ECOSYSTEM_INTEGRATION.md) — identity and a future versioned event shape for optional cross-app features.

The guiding rule is simple: LokBounce is a Bible companion first. Other Lok features can connect later when they support that purpose.
