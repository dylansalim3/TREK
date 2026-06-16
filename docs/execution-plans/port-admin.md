# R25 — Port `/api/admin`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 2700–2799
**Blocked by:** none (backup tab stubs `501` until F6 ships)
**Blocks:** none

## Goal

Admin panel: user management, default settings, audit logs, addons toggles,
GitHub release polling, MCP tokens, OAuth sessions, permissions, packing
templates, invites, notification preferences, JWT rotation, dev test
endpoints, backup tab.

## Scope

- [ ] Port admin-specific migrations (`audit_log`, `invites`, `addons`,
      `packing_templates*`, `permissions`, etc).
- [ ] `worker/src/routes/admin.ts` — the largest single router. Split
      into sub-files under `worker/src/routes/admin/` if it grows.
- [ ] `requireAdmin` middleware on all endpoints.
- [ ] Backup endpoints proxy to F6's `worker/src/services/backup.ts`;
      until F6 ships, return `501 BACKUP_NOT_CONFIGURED`.
- [ ] JWT rotation: write new secret with `wrangler secret put`
      programmatically? No — Workers can't rotate their own secrets.
      Implement as: bump `password_version` for all users (invalidates
      all sessions); document the manual `wrangler secret put`.
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/admin.ts` (475 lines)
- Many services under `server/src/services/`

## Done-when

Sign in as the first user (admin), open `/admin`, every panel loads
without 501s (except backup until F6 lands).
