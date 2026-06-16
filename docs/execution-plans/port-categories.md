# R4 — Port `/api/categories`

**Status:** ✅ Done
**Owner:** unassigned
**Migration block:** 0600–0699 (no schema changes needed)
**Blocked by:** none
**Blocks:** none

Completed: 2026-06-16

## Goal

CRUD for user-scoped place categories.

## Scope

- [x] `worker/src/routes/categories.ts`: `GET`, `POST`, `PUT /:id`, `DELETE /:id`.
- [x] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/categories.ts`
- Service: `server/src/services/categoryService.ts`
- Schema: `categories` table in 0001.

## Done-when

Tests green + dev Worker round-trip works.

## Changes

- `worker/src/routes/categories.ts` — Hono router with all 4 CRUD endpoints
- `worker/src/middleware/auth.ts` — added `adminOnly` middleware
- `worker/src/index.ts` — mounted categories router, removed from STUBBED_PREFIXES
- `worker/tests/integration/categories.test.ts` — 10 integration tests (CAT-001 through CAT-010)
