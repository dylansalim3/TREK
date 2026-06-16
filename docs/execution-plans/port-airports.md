# R5 — Port `/api/airports`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 0700–0799
**Blocked by:** none
**Blocks:** none

## Goal

Search airports by name/code (`GET /airports/search?q=`) and look up by
IATA (`GET /airports/:iata`). Backing dataset is static — embed as JSON or
seed a D1 table.

## Scope

- [ ] If the dataset is small (<1 MB), embed as a JS module and serve
      in-memory. Otherwise: migration `0700_airports.sql` + a seed script.
- [ ] `worker/src/routes/airports.ts`: `GET /search`, `GET /:iata`.
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/airports.ts`
- Source data: `server/src/data/airports.json` (or wherever it lives)

## Done-when

`/api/airports/search?q=tokyo` returns NRT + HND in <500 ms cold.
