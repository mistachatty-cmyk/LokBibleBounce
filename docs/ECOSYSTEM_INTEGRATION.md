# Lok ecosystem integration contract

LokBounce uses the existing LokBook Supabase Auth project and `auth.users.id` for optional session sync. Guest use needs no account. In the MVP, a reading session has a stable UUID, start and finish timestamps, chosen goal, active seconds, translation ID, and completion flag. Reminder times remain on the user's computer.

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
