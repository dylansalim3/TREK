# R2 — Port `/api/settings`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 0400–0499
**Blocked by:** none
**Blocks:** none

## Goal

Port the per-user settings endpoints: `GET /settings`, `PUT /settings`,
`POST /settings/bulk`.

## Scope

- [ ] `worker/src/routes/settings.ts` with `requireAuth` middleware.
- [ ] Mount under `/api/settings`, remove from `STUBBED_PREFIXES`.
- [ ] Port tests from `server/tests/integration/settings.test.ts`.

## Source references

- Route: `server/src/routes/settings.ts`
- Schema: `user_settings` table in 0001.

## Done-when

`PUT /settings { key, value }` followed by `GET /settings` returns the new
value for the authenticated user.
