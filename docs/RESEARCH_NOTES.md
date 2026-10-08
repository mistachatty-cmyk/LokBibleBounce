# Research notes and source decisions

**Status:** Planning research, not a claim that the app or integrations are implemented. Recheck versions, pricing, licensing, and platform behavior at implementation and release time.

## Existing repositories and integration points

| Resource | What it contributes | Decision for LokBounce |
| --- | --- | --- |
| [LokBibleBounce](https://github.com/mistachatty-cmyk/LokBibleBounce) | Empty starting repository when planning began. | Build the Bible companion here. |
| [LokBook](https://github.com/mistachatty-cmyk/LokBook) | React/Vite, Tauri, Supabase Auth, and existing Lok identity. | Reuse the identity project, not LokBook's feed, games, shop, or currency in the MVP. |
| [.Lok animation format](https://github.com/mistachatty-cmyk/.Lok) | Open, MIT-licensed short-animation format and reference codec. | Keep an optional future asset adapter; no need to make Bible text depend on it. |
| [LokLingu](https://github.com/mistachatty-cmyk/LokLingu) | Local-first profile precedent. | Use its offline-friendly principle; do not assume it shares LokBook authentication today. |
| GSix.online Tamagotchi | Future companion idea supplied by the user; no verified public integration contract was found. | Reserve a versioned reading-session event and design the pet integration only after its actual API/data rules are known. |

## Gemini proposal: useful leads and adjustments

- **Tauri, Electron, Flutter:** Tauri best matches LokBook's existing desktop direction and gives a smaller first-release stack. Electron has mature window APIs such as [`setIgnoreMouseEvents`](https://www.electronjs.org/docs/latest/api/browser-window), but its larger runtime and an additional native-overlay dependency are unnecessary unless a measured Tauri limitation forces a change. Flutter would add a second UI stack without a demonstrated overlay advantage here.
- **Overlay:** A compact moving window is the first prototype. Tauri exposes [always-on-top, cursor, and monitor APIs](https://v2.tauri.app/reference/javascript/api/namespacewindow/). Neither Tauri nor Electron alone guarantees visibility over genuine exclusive fullscreen. [Microsoft explains](https://devblogs.microsoft.com/directx/demystifying-full-screen-optimizations/) why overlays work better with borderless/fullscreen optimization and why traditional fullscreen injection is riskier. The suggested `electron-overlay-window` link in the supplied notes was inaccurate; the reviewed project is [SnosMe/electron-overlay-window](https://github.com/SnosMe/electron-overlay-window). Its documentation does not prove universal exclusive-fullscreen support.
- **Animation:** Use lightweight CSS transforms for the first book opening and cover changes. Keep [StPageFlip](https://github.com/Nodlik/StPageFlip) as a later page-turn option. Three.js and PixiJS are possibilities for richer future visuals, but add complexity before the reading experience needs them.
- **Bible text:** [bible-api.com](https://bible-api.com/) offers random verses and chapter data, including WEB and KJV, but its published rate limit and availability disclaimer make it unsuitable as the app's required runtime source. Bundle text from [eBible's public-domain WEB](https://ebible.org/details.php?id=engwebp) and [KJV](https://ebible.org/bible/details.php?id=eng-kjv) editions for offline use. Verify edition mapping and distribution terms before release; eBible notes a UK restriction concerning KJV printing.
- **Sync and cost:** Local reminders and bundled texts require no hosted API. Optional login/progress sync can use LokBook's existing Supabase project, subject to its current limits and configuration. Supabase tables exposed to clients need user-scoped row-level policies. [Supabase Auth](https://supabase.com/docs/guides/auth) and [email-link documentation](https://supabase.com/docs/guides/auth/auth-email-passwordless) are the implementation references. Changing a project's global email template solely for LokBounce could affect LokBook, so use its existing magic-link setup with a desktop callback.
- **State:** React state plus a small persisted local store is sufficient for the MVP. Zustand or Pinia can be reconsidered if state complexity grows; neither is required for a bouncing book and reader.

## Open validation work

1. Measure Tauri overlay smoothness, click accuracy, and battery/CPU use on real Windows hardware, including mixed-DPI monitors and a borderless game.
2. Verify the exact WEB/KJV source editions, verse counts, book IDs, and cover attribution/rights before packaging.
3. Confirm LokBook's Supabase redirect allow-list and migration process before enabling the shared login. Preserve its current sign-in flow.
4. Inspect a real GSix integration contract before defining cross-app pet rewards or importing Tamagotchi code.
