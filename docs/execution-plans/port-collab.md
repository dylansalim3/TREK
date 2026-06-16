# R18 — Port `/api/trips/:tripId/collab` (notes + polls + messages)

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 2000–2099
**Blocked by:** none (works without F4 — broadcasts no-op until F4 ships)
**Blocks:** none

## Goal

Collab module: shared notes, polls (create/vote/close), chat messages
(send/delete/react/link-preview).

## Scope

- [ ] Port collab-specific migrations
      (`collab_notes`, `collab_polls`, `collab_messages`, etc).
- [ ] `worker/src/routes/collab.ts`.
- [ ] Side-effect: call `broadcastToTrip()` from F4 on each mutation. If
      F4's helper doesn't exist yet, import a stub from
      `worker/src/services/realtime.ts` that just logs.
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/collab.ts` (328 lines)
- Service: `server/src/services/collabService.ts`

## Done-when

Create a note, vote on a poll, send a chat message — all round-trip on
dev Worker.
