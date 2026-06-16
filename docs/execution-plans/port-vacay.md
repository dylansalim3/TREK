# R22 — Port `/api/vacay`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 2400–2499
**Blocked by:** none
**Blocks:** none

## Goal

Vacay addon: vacation plan, members, year balances, entries, holiday
calendars.

## Scope

- [ ] Port vacay-specific migrations (`vacay_plans`, `vacay_members`,
      `vacay_balances`, `vacay_entries`, `vacay_holidays`).
- [ ] `worker/src/routes/vacay.ts`.
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/vacay.ts` (194 lines)
- Service: `server/src/services/vacayService.ts`

## Done-when

Create plan, add a member with 25-day balance, log an entry, see the
balance decrement.
