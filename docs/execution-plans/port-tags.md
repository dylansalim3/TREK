# R3 — Port `/api/tags`

**Status:** ✅ Done
**Owner:** unassigned
**Migration block:** 0500–0599 (no schema changes needed)
**Blocked by:** none
**Blocks:** none

Completed: 2026-06-16

## Goal

CRUD for user-scoped tags used to label places and journeys.

## Scope

- [x] `worker/src/routes/tags.ts`: `GET`, `POST`, `PUT /:id`, `DELETE /:id`.
- [x] Mount under `/api/tags`, remove from `STUBBED_PREFIXES`.
- [x] Port tests.

## Source references

- Route: `server/src/routes/tags.ts`
- Service: `server/src/services/tagsService.ts`
- Schema: `tags` table in 0001.

## Done-when

Create-list-update-delete round-trip works against the dev Worker.

## Changes

- `worker/src/routes/tags.ts` — Hono router with all 4 CRUD endpoints
- `worker/src/index.ts` — mounted tags router, removed from STUBBED_PREFIXES
- `worker/tests/integration/tags.test.ts` — 10 integration tests (TAG-001 through TAG-010)
