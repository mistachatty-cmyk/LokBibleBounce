# Lok ecosystem integration contract

LokBounce uses the existing LokBook Supabase Auth project and `auth.users.id` for optional session sync. Guest use needs no account. In the MVP, a reading session has a stable UUID, start and finish timestamps, chosen goal, active seconds, translation ID, and completion flag. Reminder times remain on the user's computer.

## Launch links for GSix and other Lok apps

The Windows installer registers the `lokbounce:` URL scheme. A user click on `lokbounce://read` opens the installed Bible reader, and `lokbounce://bounce` starts the overlay bounce. A normal HTTPS download link should be shown beside each launch link because browsers cannot tell reliably whether the desktop app is installed. These links carry no identity, Scripture text, or user data. Unknown actions are ignored. `lokbounce://auth/callback` remains reserved for the optional Lok sign-in flow and must not be used as a general launch URL.

The GSix page at `/lokbounce` hosts the installer and a separate unpacked Chromium extension preview. The extension can add a Bible to a user-selected web page; it does not create a native overlay or send browsing data to Lok. The desktop app remains the owner of reminders and timed sessions, so other apps should link into it rather than creating duplicate reminders.

Future Lok or GSix adapters can map a saved session into a versioned event without changing the timer data:

```json
{
  "type": "lok.bible.reading_session.completed",
  "version": 1,
  "eventId": "<session UUID>",
  "userId": "<Lok auth user ID>",
  "occurredAt": "<finished_at ISO 8601>",
  "data": {
    "activeSeconds": 1200,
    "goalSeconds": 1200,
    "translation": "web"
  }
}
```

The event is a planning contract, not a live integration. Do not publish the user's verse choices, notes, or full reading history to another Lok app by default. A future pet/Tamagotchi feature should ask for opt-in, agree on its real GSix API, and keep reward rules outside the Bible text and reader. This leaves room to reuse art or animation systems later without coupling them to a translation or theological score.

See [the full post-MVP backlog](POST_MVP_IDEAS.md) for GSix compatibility, shared navigation, achievements, cosmetics, and other ideas retained for later.
