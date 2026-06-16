# R1 — Port `/api/config` (publicConfig)

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 0300–0399 (likely unused — config is read-only)
**Blocked by:** none
**Blocks:** none

## Goal

Serve `GET /api/config` returning `{ defaultLanguage }` (and any other
public bootstrap config). Read-only, no auth.

## Scope

- [ ] `worker/src/routes/publicConfig.ts` exporting a Hono router with
      `GET /` → `{ defaultLanguage }`.
- [ ] Mount in `worker/src/index.ts`: `app.route('/api/config', publicConfigRoutes)`.
- [ ] Remove `'publicConfig'` from `STUBBED_PREFIXES`.
- [ ] Test: `app.fetch(new Request('http://x/api/config'))` returns 200
      with the expected shape.

## Source references

- Route: `server/src/routes/publicConfig.ts` (10 lines)
- Default settings read from `app_settings` table (already in 0001 schema).

## Done-when

`curl https://trek-api-dev.<acct>.workers.dev/api/config` returns the
expected JSON.
