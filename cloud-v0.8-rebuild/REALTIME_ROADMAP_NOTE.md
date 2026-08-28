# v0.8 Realtime roadmap status — build 20260828.2200

- Native Supabase Realtime Postgres Changes transport: implemented.
- Match-scoped push subscriptions: `match_state` UPDATE + `match_events` INSERT.
- Confirmed snapshot remains the only live-state authority after every push.
- Polling remains a fallback if Realtime is unavailable or disconnected.
- Visible sync status: Realtime / connecting / polling fallback / offline.
- Cross-device near-immediate synchronization is technically enabled but remains a device-practice validation item until desktop + Android are tested together.
- Concurrent coach mutation conflict policy and full offline write/replay remain future roadmap items.
