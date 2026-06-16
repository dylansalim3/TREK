# R7 — Port `/api/weather`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 0900–0999
**Blocked by:** none
**Blocks:** none

## Goal

Proxy to the weather provider (Open-Meteo or whatever's configured) and
cache results per (lat, lng, date) for a short TTL.

## Scope

- [ ] `worker/src/routes/weather.ts`: `GET /` and `GET /detailed` with
      `(lat, lng, date)` query params.
- [ ] Cache in `caches.default` or a D1 `weather_cache` table (migration
      `0900_weather_cache.sql`) keyed by `(lat_round, lng_round, date)`.
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/weather.ts`
- Service: `server/src/services/weatherService.ts`

## Done-when

Two identical calls — second hits cache; cache misses fetch upstream.
