# R10 — Port `/api/trips/:tripId/places`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 1200–1299
**Blocked by:** none
**Blocks:** none

## Goal

The biggest single CRUD prefix: list/create/update/delete places plus
import paths (GPX, Google list, Naver list, map file, bulk delete, place
image search).

## Scope

- [ ] `worker/src/routes/places.ts`.
- [ ] Tag/category join queries — port `getPlaceWithTags` helper into
      `worker/src/db/placeHelpers.ts`.
- [ ] Import endpoints: parse uploaded file in-Worker (GPX is XML —
      use `fast-xml-parser`).
- [ ] `bulk-delete`: use `env.DB.batch([...])`.
- [ ] Mount, unstub, port tests (the largest test file).

## Source references

- Route: `server/src/routes/places.ts` (266 lines)
- Service: `server/src/services/placesService.ts`

## Done-when

Create place, import GPX (small file), bulk-delete — all round-trip on
dev Worker.
