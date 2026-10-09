# Implementation and release checks

## Architecture

- Tauri 2 starts with only a 170 × 170 transparent always-on-top book window and tray. The book rests in a selected corner while a Rust reminder loop runs. Clicking the book expands its compact options menu; only **Open Bible & read** creates the full reader window. Closing the reader destroys that window and returns the book to its resting mode. Moving only the book window keeps other apps clickable outside its footprint.
- The reminder loop reads device-local schedules from app data at startup, deduplicates each reminder per local calendar day, supports ten-minute snooze, and quiets a due bounce after two minutes with a Windows notification. Closing the reader hides it to the tray; launch at Windows startup is an opt-in setting.
- React handles the offline WEB/KJV reader, two-page Bible spread, chapter view, cover change, reminder editor, session timer, progress, and account UI. The Bible JSON comes from pinned eBible archives and is bundled in the installer. No verse request or paid API is needed at reading time. The overlay pauses on book hover and briefly compresses/tilts when the native movement loop reports an edge impact.
- Guest preferences and history use webview local storage. Reminders, resting mode, and corner choice are copied to native app data for the background scheduler. Supabase access tokens use Windows Credential Manager. Optional signed-in history sync targets a user-owned `lok_bible_sessions` table in the shared LokBook project.

## Verified so far

- `npm run build` passes TypeScript and Vite production build.
- `npm test` checks both offline corpora, John 3:16, random verse validity, active reading time, pause/resume, and long-gap behavior.
- Generated icons and the Tauri configuration are present. A Windows CI job builds the installer and uploads it as an artifact.
- The first Windows CI run compiled the native app and produced an NSIS installer. Later branch changes still require their own passing run.

## Release checks still required

1. Confirm the latest Windows CI job completes a native compile and produces the NSIS installer.
2. Install on Windows and exercise first launch as book only, book menu to reader, close-to-corner, click accuracy, edge reaction, movement, multiple monitors/scaling, browser and ordinary app stacking, borderless games, tray rest/bounce/quit, autostart, and sleep/resume. Record frame pacing and idle resource use before claiming a polished motion experience.
   Earlier portable EXEs aborted with Windows `0xC0000409`. Captured Rust stderr identified a webview command calling `state()` before `manage()`; the shared state is now registered in the Tauri builder before window creation. Verify the rebuilt EXE on Windows before releasing or promising stable desktop use.
3. Check daily and weekday reminders around restart, daylight saving, snooze, and system clock changes. Verify the notification fallback on an exclusive-fullscreen test case.
4. Review and apply the Supabase migration to the existing LokBook project, allow `lokbounce://auth/callback` as an Auth redirect, then test guest merge, sign-out, and cross-account RLS denial.
5. Review the edition notices and release packaging. The KJV source is eBible's `eng-kjv` 1769 text, filtered to the 66-book canon. The WEB source is `engwebp`.

Until these checks pass, treat the repository as a development build rather than a released Windows app.
