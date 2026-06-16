# R9 — Port `/api/trips/:tripId/days` + `dayNotes`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 1100–1199
**Blocked by:** none
**Blocks:** none

## Goal

CRUD for trip days and per-day notes.

## Scope

- [ ] `worker/src/routes/days.ts`: `GET/POST/PUT/:dayId/DELETE/:dayId` on
      `/api/trips/:tripId/days`.
- [ ] `worker/src/routes/dayNotes.ts`: same shape on
      `/api/trips/:tripId/days/:dayId/notes`.
- [ ] Both routers mounted in `index.ts`; both prefixes removed from
      `STUBBED_PREFIXES`.
- [ ] `requireTripAccess(tripId)` middleware (shared with other plans —
      define in `worker/src/middleware/tripAccess.ts` if missing).
- [ ] Port tests.

## Source references

- Routes: `server/src/routes/days.ts`, `server/src/routes/dayNotes.ts`
- Schema: `days` and `day_notes` tables in 0001.

## Done-when

CRUD round-trip on dev Worker; non-member of the trip is rejected with 403.
