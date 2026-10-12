# LokBibleBounce browser companion

This Manifest V3 extension works in Chrome and other Chromium browsers. It adds a small optional Bible to the **current page** when you press the extension button and choose **Bounce on this page**. Click the Bible for a KJV verse and a full-chapter link. Press the extension action again on that page to remove it. It also launches the installed Windows desktop app through `lokbounce://read` and `lokbounce://bounce` links.

The extension requests `activeTab` and `scripting` so it can act only on a page after the user clicks its button. It does not read browsing history, send page contents, use a background worker, or sync reading activity. Browser internal pages and some protected sites disallow injection. The desktop app remains the way to bounce over other applications and to read full chapters offline.

## Install a development build

Extract the extension ZIP. In Chrome, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the extracted `extension` directory. Store publication requires separate review and a store listing; this ZIP is an unpacked preview.
