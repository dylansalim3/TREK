# R13 — Port `/api/trips/:tripId/todo`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 1500–1599
**Blocked by:** none
**Blocks:** none

## Goal

Per-trip todo list with categories and assignees.

## Scope

- [ ] Port any todo-specific migrations from
      `server/src/db/migrations.ts` into this plan's number block.
- [ ] `worker/src/routes/todo.ts`.
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/todo.ts` (127 lines)
- Service: `server/src/services/todoService.ts`

## Done-when

Create todos in two categories, reorder one, set assignees — all
round-trip on dev.
