# R4 — Port `/api/categories`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 0600–0699
**Blocked by:** none
**Blocks:** none

## Goal

CRUD for user-scoped place categories.

## Scope

- [ ] `worker/src/routes/categories.ts`: `GET`, `POST`, `PUT /:id`, `DELETE /:id`.
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/categories.ts`
- Service: `server/src/services/categoriesService.ts`
- Schema: `categories` table in 0001.

## Done-when

Tests green + dev Worker round-trip works.
