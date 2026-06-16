# R3 — Port `/api/tags`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 0500–0599
**Blocked by:** none
**Blocks:** none

## Goal

CRUD for user-scoped tags used to label places and journeys.

## Scope

- [ ] `worker/src/routes/tags.ts`: `GET`, `POST`, `PUT /:id`, `DELETE /:id`.
- [ ] Mount under `/api/tags`, remove from `STUBBED_PREFIXES`.
- [ ] Port tests.

## Source references

- Route: `server/src/routes/tags.ts`
- Service: `server/src/services/tagsService.ts`
- Schema: `tags` table in 0001.

## Done-when

Create-list-update-delete round-trip works against the dev Worker.
