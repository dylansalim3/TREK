# R2 — Port `/api/settings`

**Status:** ✅ Done
**Owner:** unassigned
**Migration block:** 0400–0499 (no schema changes needed)
**Blocked by:** none
**Blocks:** none

Completed: 2026-06-16

## Goal

Port the per-user settings endpoints: `GET /settings`, `PUT /settings`,
`POST /settings/bulk`.

## Scope

- [x] `worker/src/routes/settings.ts` with `requireAuth` middleware.
- [x] Mount under `/api/settings`, remove from `STUBBED_PREFIXES`.
- [x] Port tests from `server/tests/integration/settings.test.ts`.

## Source references

- Route: `server/src/routes/settings.ts`
- Schema: `user_settings` table in 0001.

## Done-when

`PUT /settings { key, value }` followed by `GET /settings` returns the new
value for the authenticated user.

## Changes

- `worker/src/routes/settings.ts` — Hono router with GET, PUT, POST /bulk
- `worker/src/index.ts` — mounted settings router, removed from STUBBED_PREFIXES
- `worker/tests/integration/settings.test.ts` — 10 integration tests (SET-001 through SET-010)
