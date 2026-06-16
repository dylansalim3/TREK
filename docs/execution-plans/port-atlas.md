# R6 — Port `/api/atlas`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 0800–0899
**Blocked by:** none
**Blocks:** none

## Goal

Aggregate "visited countries/regions" stats per user across all trips.

## Scope

- [ ] `worker/src/routes/atlas.ts`: read-only endpoints summarizing
      `places` joined with country/region metadata.
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/atlas.ts`
- Service: `server/src/services/atlasService.ts`

## Done-when

`GET /api/atlas` returns parity with the Express response for a user with
≥1 trip with places.
