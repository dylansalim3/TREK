# R15 — Port `/api/trips/:tripId/budget`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 1700–1799
**Blocked by:** none
**Blocks:** none

## Goal

Per-trip budget items with categories, members, paid status, settlement
calculation.

## Scope

- [ ] Port budget-specific migrations (`budget_items`, `budget_members`,
      etc).
- [ ] `worker/src/routes/budget.ts`.
- [ ] Settlement endpoint: compute who-owes-who in JS in the handler.
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/budget.ts` (189 lines)
- Service: `server/src/services/budgetService.ts`

## Done-when

Per-person summary and settlement endpoints match Express output for a
4-member trip with 10 expenses.
