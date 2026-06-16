# R16 — Port `/api/trips/:tripId/share-link` + `/shared/:token`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 1800–1899
**Blocked by:** none
**Blocks:** none

## Goal

Public read-only share links for trips with per-section permissions.

## Scope

- [ ] If missing from 0001, migration `1800_share_links.sql`.
- [ ] `worker/src/routes/share.ts`: owner endpoints
      (`GET/POST/DELETE /api/trips/:tripId/share-link`).
- [ ] `worker/src/routes/sharedPublic.ts`: public read-only
      (`GET /api/shared/:token`).
- [ ] Mount both; remove `'share'` from `STUBBED_PREFIXES` and add a route
      for `/api/shared/*` (separate from `/api/share/*`).
- [ ] Port tests.

## Source references

- Route: `server/src/routes/share.ts` (61 lines)
- Service: `server/src/services/shareService.ts`

## Done-when

Create a share link, hit the public URL in an incognito window, see the
trip; revoke link → 404 on the public URL.
