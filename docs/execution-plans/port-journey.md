# R21 — Port `/api/journeys` + public journey share

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 2300–2399
**Blocked by:** none
**Blocks:** none

## Goal

Journey module: CRUD, entries, photos (gallery + per-entry), contributors,
share links, public viewer.

## Scope

- [ ] Port journey-specific migrations.
- [ ] `worker/src/routes/journey.ts`: authenticated endpoints.
- [ ] `worker/src/routes/journeyPublic.ts`: public read-only at
      `/api/public/journey/:token`.
- [ ] Mount both; remove `'journey'` from `STUBBED_PREFIXES`.
- [ ] Port tests.

## Source references

- Route: `server/src/routes/journey.ts` (393 lines)
- Route: `server/src/routes/journeyPublic.ts` (56 lines)
- Service: `server/src/services/journeyService.ts`

## Done-when

Create journey, add 3 entries with photos, create share link, view in
incognito.
