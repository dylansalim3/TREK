# R11 — Port `/api/trips/:tripId/days/:dayId/assignments`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 1300–1399
**Blocked by:** none
**Blocks:** none

## Goal

Day-plan assignments: assign places to days, reorder, move across days,
manage participants, set times.

## Scope

- [ ] `worker/src/routes/assignments.ts`.
- [ ] Reorder endpoint uses `D1.batch([...])` for atomicity.
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/assignments.ts` (137 lines)
- Service: `server/src/services/assignmentsService.ts`

## Done-when

Reorder a 5-item day plan — order persists; move an assignment to another
day — old day list shrinks, new day list grows.
