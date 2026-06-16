# Plan template

Copy this when adding a new plan. Each plan must be runnable by a single
agent with no coordination with other plans.

---

# `<title>`

**ID:** `<F#>` or `<R#>`
**Status:** ⏳ Not started   <!-- ⏳ Not started | 🚧 In progress | ✅ Done | 🚫 Blocked -->
**Owner:** unassigned
**Migration block:** XXXX–XXXX (or `—` if no schema changes)
**Blocked by:** none
**Blocks:** none

## Goal

One paragraph: what behavioral parity must this plan achieve?

## Scope (checklist for the agent)

- [ ] Add migrations (claim from this plan's block).
- [ ] Implement Hono router at `worker/src/routes/<prefix>.ts`.
- [ ] Mount the router in `worker/src/index.ts`.
- [ ] Remove `'<prefix>'` from `STUBBED_PREFIXES` if applicable.
- [ ] Port tests from `server/tests/integration/<prefix>.test.ts` to
      `worker/tests/integration/<prefix>.test.ts` using `app.fetch(new Request(...))`.
- [ ] `cd worker && npm test` passes.
- [ ] Manual smoke against the dev Worker (curl or browser) returns parity.
- [ ] Update this file: set `Status: ✅ Done` and append a `## Completion`
      section with the commit SHA + date.

## Source references

- Route: `server/src/routes/<prefix>.ts`
- Service(s): `server/src/services/<…>.ts`
- Tests: `server/tests/integration/<prefix>.test.ts`

## D1 / Workers caveats

- D1's `prepare/bind/all` is async; replace synchronous `better-sqlite3` calls.
- `D1Database.batch([...])` for multi-statement transactions.
- `INSERT … RETURNING`, `INSERT OR REPLACE`, and foreign keys all work natively.
- No `fs`, no `net`. R2 for file I/O, fetch for HTTP.

## Done-when

Worker tests green + manual smoke matches Express behavior + this file
marked done in the README index.
