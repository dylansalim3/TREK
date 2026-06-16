# R12 — Port `/api/trips/:tripId/packing`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 1400–1499
**Blocked by:** none
**Blocks:** none

## Goal

Packing list CRUD + bags + templates.

## Scope

- [ ] If migrations 1400–1499 introduce schema missing from 0001, add
      them here (bags, category assignees, template tables).
- [ ] `worker/src/routes/packing.ts`.
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/packing.ts` (271 lines)
- Service: `server/src/services/packingService.ts`
- Migrations to port: search `server/src/db/migrations.ts` for `packing`,
  `bags`, `category_assignees`.

## Done-when

Apply a packing template to a fresh trip; bags + items appear in
`GET /packing`.
