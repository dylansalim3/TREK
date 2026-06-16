# F4 — WebSocket client wiring + ephemeral tokens

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 0200–0299
**Blocked by:** none
**Blocks:** none (collab plan R18 ships with stubs; this plan enables real
                 broadcast)

## Goal

The `TripRoom` Durable Object already exists. Wire it end-to-end:

1. Implement ephemeral token issuance so the client can authenticate the
   WebSocket without a JWT in the URL.
2. Add a per-trip broadcast path so route handlers can push updates.
3. Update the client to hit `/ws/:tripId` (per-trip) with the ephemeral
   token, instead of the legacy `/ws?token=…`.

## Scope

- [ ] Migration `0200_ephemeral_tokens.sql`:
  ```sql
  CREATE TABLE ephemeral_tokens (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    purpose TEXT NOT NULL,        -- 'ws' | 'download' | …
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX idx_ephemeral_tokens_expires ON ephemeral_tokens(expires_at);
  ```
- [ ] `worker/src/routes/auth.ts`: add `POST /api/auth/ws-token` →
      `{ token: string }`. Token expires in 60s, single-use.
- [ ] Update `TripRoom.fetch()` to:
  - Accept `/internal/broadcast` (POST JSON) for server-originated pushes.
  - Validate the ephemeral token on WebSocket upgrade.
- [ ] Update `worker/src/index.ts` `/ws/:tripId` to forward `Upgrade`
      requests to the DO; reject non-upgrade non-internal requests.
- [ ] Helper `broadcastToTrip(env, tripId, payload)` in
      `worker/src/services/realtime.ts` for routers to call.
- [ ] Client: change `getWsUrl()` to `wss://<host>/ws/<tripId>?token=…`.
- [ ] Tests: two WS connections to the same `tripId` see each other's
      messages; closing one fires a `leave` to the other.

## Source references

- Express WS: `server/src/realtime.ts`
- Ephemeral tokens: `server/src/services/ephemeralTokens.ts`
- Client WS: `client/src/api/websocket.ts`

## Done-when

Two browser tabs open the same trip on the dev Worker, edit a place, both
see the update without a refresh.
