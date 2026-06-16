# R1 — Port `/api/config` (publicConfig)

**Status:** ✅ Done
**Owner:** unassigned
**Migration block:** 0300–0399 (unused — config is read-only)
**Blocked by:** none
**Blocks:** none

Completed: 2026-06-16

## Goal

Serve `GET /api/config` returning `{ defaultLanguage }` (and any other
public bootstrap config). Read-only, no auth.

## Scope

- [x] `worker/src/routes/publicConfig.ts` exporting a Hono router with
      `GET /` → `{ defaultLanguage }`.
- [x] Mount in `worker/src/index.ts`: `app.route('/api/config', publicConfigRoutes)`.
- [x] Remove `'publicConfig'` from `STUBBED_PREFIXES`.
- [x] No Express test existed for this prefix.

## Source references

- Route: `server/src/routes/publicConfig.ts` (10 lines)
- Default settings read from `app_settings` table (already in 0001 schema).

## Done-when

`curl https://trek-api-dev.<acct>.workers.dev/api/config` returns the
expected JSON.

## Changes

- `worker/src/routes/publicConfig.ts` — GET / → `{ defaultLanguage: 'en' }`
- `worker/src/index.ts` — mounted at `/api/config`, removed from STUBBED_PREFIXES
