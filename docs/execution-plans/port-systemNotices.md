# R8 — Port `/api/system-notices`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 1000–1099
**Blocked by:** none
**Blocks:** none

## Goal

Serve admin-published system notices (banners shown on app load).

## Scope

- [ ] If schema isn't already in 0001, migration `1000_system_notices.sql`.
- [ ] `worker/src/routes/systemNotices.ts`: `GET /` (public), `POST/PUT/DELETE`
      (admin-only).
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/systemNotices.ts`
- Service: `server/src/services/systemNoticesService.ts`

## Done-when

Admin posts a notice; non-admin user sees it in `GET /api/system-notices`.
