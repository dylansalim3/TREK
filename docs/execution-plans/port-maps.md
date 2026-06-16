# R17 — Port `/api/maps`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 1900–1999
**Blocked by:** none
**Blocks:** none

## Goal

Proxy maps provider (Google Places, OSM Nominatim, etc) for search,
autocomplete, details, reverse geocode, place-photo lookup, resolve-url.

## Scope

- [ ] `worker/src/routes/maps.ts`: port all endpoints from Express.
- [ ] Provider keys come from `env` vars or `wrangler secret`:
      `GOOGLE_MAPS_API_KEY`, etc. Auth-required for write paths.
- [ ] Mount, unstub, port tests (mock fetch in tests).

## Source references

- Route: `server/src/routes/maps.ts` (162 lines)
- Service: `server/src/services/mapsService.ts`

## Done-when

`POST /api/maps/search` with a real key returns Google Places result;
without a key returns `503 PROVIDER_NOT_CONFIGURED`.
