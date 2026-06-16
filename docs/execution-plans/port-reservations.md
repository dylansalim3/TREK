# R14 — Port `/api/trips/:tripId/reservations`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 1600–1699
**Blocked by:** none
**Blocks:** none

## Goal

Reservations (hotels, flights, restaurants, transport) plus position
updates for day-plan integration.

## Scope

- [ ] Port reservation-specific migrations.
- [ ] `worker/src/routes/reservations.ts`.
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/reservations.ts` (199 lines)
- Service: `server/src/services/reservationsService.ts`

## Done-when

Create reservation, update positions on a day, delete — round-trip on dev.
