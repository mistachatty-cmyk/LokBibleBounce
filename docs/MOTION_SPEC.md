# Bounce and opening motion

The bouncing Bible is the main Windows experience. Launching LokBounce shows the small book without opening the reader. Clicking it opens the two-page Bible around a random verse. Closing the reader returns to the passive book. The tray pauses or resumes bouncing; launching with Windows is optional.

## Current motion model

- The Rust scheduler moves a 170 × 170 transparent window on the display containing the reader. Velocity is 92 logical pixels per second horizontally and 68 vertically, converted to physical pixels with the monitor scale factor.
- Position changes use elapsed time, with each update capped at 50 ms so waking after a pause cannot send the book across the screen. Each axis reflects overshoot at the screen boundary. An update is requested about every 16 ms while the book is moving.
- Entering the book pauses its movement so it can be clicked. Edge contact briefly compresses and tilts the book for 390 ms; corner contact has its own response. Motion is silent. The app's Reduce motion preference suppresses this flourish.
- The browser's “See the bounce” control is a preview inside the page. Only the downloadable Windows app can float over other programs.

## Release checks for the motion experience

1. On a clean Windows install, confirm the book appears alone on launch, remains above ordinary windows, can be clicked, and returns when the reader closes. Confirm tray pause/resume and restart behavior.
2. Film or screen-record the bounce on 60 Hz and high-refresh displays. Check steady speed, clean contact with all four edges, corner contact, visible book bounds, and no teleport after sleep or display changes. Target a 95th-percentile motion update gap below 33 ms on a normal desktop without another heavy workload; record hardware and results rather than claiming this before measurement.
3. Check pointer hover and click accuracy as the book passes under a stationary cursor and as a pointer approaches it. Verify input outside the small overlay window still reaches the app below.
4. Check 100%, 150%, and 200% display scaling; mixed-DPI displays; negative monitor origins; disconnecting a monitor; borderless games; and foreground browser windows.
5. Open short and long verses, switch WEB/KJV, and test the cover opening with normal and reduced motion. The verse should remain readable and the controls reachable without clipping.
6. Measure idle CPU, GPU, and memory use for at least 15 minutes on a target Windows machine. Tune the movement interval and animations if the book causes visible jank or excessive resource use.

The current bounce responds to **screen edges**. Collisions with desktop icons, other windows, or arbitrary objects are a separate idea, [O-13](POST_MVP_IDEAS.md#overlay-and-platforms). An actual Windows `.scr` idle screensaver is [O-09](POST_MVP_IDEAS.md#overlay-and-platforms). Genuine exclusive-fullscreen games may cover the standard always-on-top window.
