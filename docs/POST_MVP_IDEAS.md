# Post-MVP ideas and future planning

**Purpose:** Keep every deferred request visible while the first release stays a respectful Bible companion. This is an idea backlog, **not a promise that every feature will ship**. Nothing listed here is part of the proposed MVP unless it is explicitly moved into [MVP_PLAN.md](MVP_PLAN.md) by a later decision.

**How to use this file:** Keep IDs stable. Mark an idea `Exploring`, `Planned`, `Built`, or `Declined` when a decision is made, and record the reason. Add new ideas at the end of the relevant section; do not delete old ones just because priorities change. `User` means it came from the conversation, `Gemini` from the supplied research notes, and `Suggested` means a planning idea to discuss later. Every item below starts as `Captured`.

## MVP baseline for comparison

The proposed first release covers Windows, a bouncing Bible on the active display, offline WEB and KJV, a random verse and full in-app chapter, weekday/daily reminders, reading timers with pause/resume, session history and totals, and optional shared Lok login. It supports ordinary windows and compatible borderless games. See [MVP_PLAN.md](MVP_PLAN.md) for the detailed acceptance criteria.

The product rule remains: **help people read Scripture with respect, clarity, and user control**. Reading time and streaks can encourage a habit; they should never be presented as a measure of faith, holiness, or spiritual worth. Any social or pet-related feature should be opt-in and preserve private reading by default.

## Overlay and platforms

| ID | Idea | Origin | What must be resolved before building |
| --- | --- | --- | --- |
| O-01 | Make reminders visible over as many genuine exclusive-fullscreen games as technically possible. | User | Research supported game/platform overlay paths, anti-cheat policies, performance, and consent. Never promise universal coverage without game-by-game testing. |
| O-02 | Add macOS and Linux desktop editions. | Suggested | Rework window, tray, notification, login callback, and game-overlay behavior per platform; document Wayland limitations. |
| O-03 | Offer one bouncing Bible on every monitor. | Suggested | Avoid visual overload and duplicate reminder actions. |
| O-04 | Let users pin the bounce to a chosen monitor instead of following the active app. | Suggested | Handle unplugged displays and changed monitor IDs. |
| O-05 | Let a single Bible travel across monitor boundaries. | Suggested | Account for separate resolutions, scaling, and gaps in monitor layout. |
| O-06 | Add a user-set bounce appearance duration, with an automatic quiet exit. | Suggested | Decide how it interacts with pending reminders and snooze. |
| O-07 | Offer gentle controls for speed, size, path, corner bounce, and movement frequency. | User | Keep defaults calm and readable; honor reduced motion. |
| O-08 | Add a global pause/bring-back shortcut and quick tray controls. | Suggested | Avoid conflicts with game shortcuts. |
| O-09 | Offer an actual Windows screensaver mode alongside the reminder overlay. | Suggested | Validate screensaver integration and lock-screen privacy separately. |
| O-10 | Add per-app and per-game quiet rules, including presentation mode. | Suggested | Detect foreground apps locally without uploading app-use history. |
| O-11 | Let users test a reminder and preview overlay placement from Settings. | Suggested | Keep the test from creating a real reading-session record. |
| O-12 | Explore game-specific integrations where a conventional overlay cannot appear. | Suggested | Only use documented, allowed APIs; assess anti-cheat and maintenance cost. |

## Scripture and reading

| ID | Idea | Origin | What must be resolved before building |
| --- | --- | --- | --- |
| B-01 | Read the whole Bible inside LokBounce with book, chapter, and verse navigation. | User | Build accessible navigation, progress position, search, and clear translation labels. |
| B-02 | Add full-text search by word, phrase, passage, and reference. | Suggested | Create an offline index for each bundled translation. |
| B-03 | Offer additional Bible translations and matching covers. | User | Obtain redistribution permission or supported licensed APIs for each version. |
| B-04 | Add more languages and downloadable translation packs. | Suggested | Check text licenses, book naming, right-to-left layout, and download size. |
| B-05 | Compare two translations side by side. | Suggested | Align verse numbering and missing/combined verses accurately. |
| B-06 | Let people bookmark passages and return to their last reading place. | Suggested | Decide local-only versus private account sync. |
| B-07 | Add private highlights, notes, and reading reflections. | Suggested | Protect sensitive notes and provide export/delete controls. |
| B-08 | Create reading plans: whole Bible, a book, a theme, or custom chapters. | Suggested | Make schedules flexible without guilt-heavy messaging. |
| B-09 | Show cross-references and optional study context. | Suggested | Use a vetted, licensed source and distinguish Scripture from commentary. |
| B-10 | Add audio Bible playback and optional read-along highlighting. | Suggested | License audio, support offline size choices, and avoid autoplay. |
| B-11 | Let users choose where random verses come from: whole Bible, Testament, book, or saved plan. | Suggested | Explain selection clearly and avoid treating random verses as authoritative answers to decisions. |
| B-12 | Keep a history of shown verses and offer a non-repeating rotation. | Suggested | Define reset behavior and protect privacy. |
| B-13 | Share a verse image or copy a passage with translation and reference. | Suggested | Respect each translation's quotation terms. |
| B-14 | Offer dyslexia-friendly, large-text, high-contrast, and screen-reader reading modes. | Suggested | Test actual assistive technology and preserve clean typesetting. |
| B-15 | Add offline content updates without losing bookmarks or notes. | Suggested | Version text editions and migrate references safely. |

## Reminders and schedules

| ID | Idea | Origin | What must be resolved before building |
| --- | --- | --- | --- |
| R-01 | Add one-time reminders on a chosen date and time. | User | Define missed-alarm behavior and time-zone changes. |
| R-02 | Add advanced recurrence, such as every other day, monthly, or custom intervals. | User | Keep rules understandable and test daylight-saving transitions. |
| R-03 | Sync selected reminder schedules across devices. | Suggested | Prevent duplicate ringing and clearly identify which device will notify. |
| R-04 | Add quiet hours, do-not-disturb integration, and meeting/presentation suppression. | Suggested | Respect OS notification settings and let users override locally. |
| R-05 | Offer schedule templates for morning, lunch, and evening reading. | Suggested | Templates must be optional; avoid prescriptive religious routines. |
| R-06 | Let reminders carry a chosen passage, book, or reading plan rather than always a random verse. | Suggested | Keep the reminder quick to read and connect it to the reader. |
| R-07 | Add calendar integration and calendar-block suggestions. | Suggested | Require explicit account permissions and avoid exposing reading titles unnecessarily. |
| R-08 | Make snooze length and notification sound customizable. | Suggested | Provide silent and accessible defaults. |
| R-09 | Add a gentle missed-reminder summary instead of repeated alerts. | Suggested | Avoid nagging and distinguish missed reminders from reading failures. |

## Sessions, progress, and motivation

| ID | Idea | Origin | What must be resolved before building |
| --- | --- | --- | --- |
| P-01 | Expand progress into weekly/monthly charts and personal goals. | User | Show active reading time honestly and make comparisons private by default. |
| P-02 | Add levels, achievements, and optional rewards for reading habits. | User | Keep rewards about consistent practice, never spiritual value; avoid manipulative streak pressure. |
| P-03 | Let people attach a passage, plan, or private note to each completed session. | Suggested | Preserve accurate session history and private sync. |
| P-04 | Let users correct or manually add a session, including physical-Bible reading. | Suggested | Mark edits transparently without punishing legitimate offline reading. |
| P-05 | Offer flexible session goals and an optional gentle ending sound. | Suggested | Avoid interrupting reading when a goal is reached. |
| P-06 | Add a focus mode that hides unrelated UI while reading. | Suggested | Keep pause, exit, and accessibility controls easy to find. |
| P-07 | Resume a reading session across devices. | Suggested | Resolve simultaneous sessions, clock drift, and offline conflicts. |
| P-08 | Export progress and session history in a portable format. | Suggested | Include privacy and deletion controls. |
| P-09 | Offer optional accountability with a trusted friend or group. | Suggested | Share only what a user explicitly selects; no public leaderboard by default. |
| P-10 | Add milestone reflections and personal celebration settings. | Suggested | Make all celebration effects skippable and compatible with reduced motion. |

## Visuals, sound, and customization

| ID | Idea | Origin | What must be resolved before building |
| --- | --- | --- | --- |
| V-01 | Give each translation a distinctive, historically considerate cover; change it automatically with the text. | User | Obtain or create rights-cleared art and avoid implying a publisher endorsement. |
| V-02 | Develop a richer book-opening micro-animation and optional page turns. | User | Keep reading responsive; test reduced motion and low-end hardware. |
| V-03 | Explore a realistic 3D Bible model. | Gemini | Only add Three.js or similar if it materially improves the experience within resource limits. |
| V-04 | Explore StPageFlip for tactile page turning. | Gemini | Validate accessibility and long-chapter performance. |
| V-05 | Add cover, color, type, shadow, and paper customization. | User | Keep text contrast high and the Bible recognizable. |
| V-06 | Accept optional `.lok` animations or Lok-created art as themes. | Suggested | Review assets, format compatibility, performance, and content moderation. |
| V-07 | Add optional subtle sound and haptic-like visual feedback. | Suggested | Default to quiet; never surprise users with audio in games or meetings. |
| V-08 | Offer light, dark, and low-distraction visual modes. | Suggested | Preserve readability and respectful presentation. |

## Lok ecosystem and GSix compatibility

The user clarified that LokBounce must remain Bible-focused. Shared login belongs in the MVP; the following connections are future options, not required feature parity with LokBook.

| ID | Idea | Origin | What must be resolved before building |
| --- | --- | --- | --- |
| L-01 | Share selected Lok themes, profile choices, and customization across apps. | User | Define a small cross-app settings contract and user-controlled sync. |
| L-02 | Let a future GSix Tamagotchi respond to completed reading sessions. | User | Obtain GSix's real data/API contract and define consent, event mapping, and anti-duplication. |
| L-03 | Add a gentle Bible-companion character inspired by GSix's Tamagotchi. | User | Make it optional and respectful; avoid replacing or speaking for Scripture. |
| L-04 | Reuse LokBook's `.lok` animation format for user-created covers or companion animation. | Suggested | Keep visual assets separate from Bible text and verify content rights. |
| L-05 | Show LokBounce reading progress in a broader Lok profile or dashboard. | Suggested | Share only with explicit permission and clear visibility controls. |
| L-06 | Consider LokBook currency, shop, or unlocks for optional cosmetics. | User | Design carefully so reading Scripture is never gated, purchased, or converted into a measure of faith. |
| L-07 | Consider selected LokBook social or creation features only where they serve Bible reading. | User | Define a concrete Bible-centered use case before importing feed, games, or social mechanics. |
| L-08 | Create a documented, versioned ecosystem event/API contract for future apps. | Suggested | Set ownership, auth scopes, privacy, idempotency, and migration rules. |

## Community and companion possibilities

| ID | Idea | Origin | What must be resolved before building |
| --- | --- | --- | --- |
| C-01 | Share an optional reading plan or passage with a friend. | Suggested | Require explicit invitations and avoid automatic disclosure of habits. |
| C-02 | Support small reading groups or church study spaces. | Suggested | Plan moderation, roles, privacy, and cost before launching. |
| C-03 | Add private prayer/reflection journaling adjacent to reading. | Suggested | Treat entries as highly sensitive and keep them separate from public features. |
| C-04 | Explore an optional study assistant that cites the passage and distinguishes commentary from Bible text. | Suggested | Verify accuracy, theological neutrality, privacy, and ongoing model cost. Never present generated text as Scripture. |
| C-05 | Add a discoverable easter egg pop-up with curated links to worthwhile videos and audio to listen to. Start with links that open the original source; consider richer media features later. | User | Choose the hidden trigger and curate sources for relevance, quality, accessibility, and rights. Keep the pop-up optional, quiet, and free of autoplay. |

### C-05 seed links

| Link | Supplied by | Notes |
| --- | --- | --- |
| [“Into Your Hands I Commit My Spirit” – Psalms of Surrender](https://www.youtube.com/watch?v=4rHDuAcuOuU) by Godseekers | User | Fun note: check out the prayer at [13:00](https://www.youtube.com/watch?v=4rHDuAcuOuU&t=780s) ❤️. User note for [30:00](https://www.youtube.com/watch?v=4rHDuAcuOuU&t=1800s): a point about having to fear God. First link for the future easter egg; verify availability and suitability again before release. |

## Distribution, accessibility, and trust

| ID | Idea | Origin | What must be resolved before building |
| --- | --- | --- | --- |
| X-01 | Add automatic signed updates and a public release channel. | Suggested | Plan code-signing cost, rollback, and transparent release notes. |
| X-02 | Add a mobile companion or browser extension. | Suggested | Keep desktop reminders authoritative and avoid duplicating sessions. |
| X-03 | Provide account data export, full deletion, and local-only mode controls. | Suggested | Verify deletion across cached and synced records. |
| X-04 | Make analytics and diagnostics opt-in, with no Bible-reading surveillance. | Suggested | Collect only what improves reliability and publish a clear privacy policy. |
| X-05 | Publish an accessibility test matrix covering keyboard, screen reader, contrast, and reduced motion. | Suggested | Test on real Windows assistive tools. |
| X-06 | Add translation/content provenance and version notices inside Settings. | Suggested | Keep users aware of the exact edition they are reading. |

## First post-MVP candidates to discuss

These are possible next steps, not a fixed sequence: **B-01** whole-Bible navigation, **R-01** one-time reminders, **O-04** fixed-monitor choice, **B-06/B-07** bookmarks and private notes, and **V-01/V-02** richer covers and animation. **O-01** remains a major research track because the user eventually wants reminders over every game.

## Add a new idea

Copy this compact template into the appropriate table or an issue:

> **ID / short title:**
>
> **Origin:** User / Gemini / Suggested
>
> **User benefit:**
>
> **Why it is outside the MVP:**
>
> **Dependencies or risks:**
>
> **Status and decision date:** Captured

If an idea is declined, keep its row and add the reason so the original thought is not lost.
