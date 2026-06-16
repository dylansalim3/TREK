# Cloudflare migration — execution plans

This folder breaks the Cloudflare Workers migration (issue #2) into
**independent** units of work that can each be picked up by a single agent
with no coordination with other agents. Each plan is self-contained: it
states its goal, owns its migration files, and ends with a green test run.

## How to work on a plan

1. **Pick a plan whose status is `⏳ Not started`.** Most plans have
   `Blocked by: none` — pick one of those.
2. **Edit the plan in place to set yourself as owner and flip status to
   `🚧 In progress`.** This prevents two agents from racing.
3. **Do the work.** Each plan tells you the source files in
   `server/src/` to port and the target files under `worker/src/`.
4. **Verify.** Run `npm test` in `worker/` — the worker test suite
   (Miniflare-backed) must stay green. Each plan also calls out a manual
   smoke step against the deployed dev Worker.
5. **Update the plan when done.** At the bottom of the plan file:
   - Set `Status: ✅ Done`.
   - Add the commit SHA and the date you finished.
   - List any follow-ups you discovered as new TODOs at the bottom.
6. **Open a PR against `dev`.** The dev deploy workflow
   (`.github/workflows/deploy-dev.yml`) will deploy to `trek-api-dev` on
   merge.

## Rule for the planner

After finishing a plan, **update this README's status table below** so the
next agent doesn't pick a plan that's already shipping. Keep the entry — do
not delete completed plans. Mark them ✅ with the date.

## Migration file numbering

To avoid collisions when multiple agents add SQL migrations in parallel:

- The base schema is `worker/migrations/0001_initial_schema.sql`.
- Each plan that needs new schema **claims a 100-number block** from the
  table below. e.g. plan `port-todo` owns `0301`–`0399`.
- Within your block, use ascending numbers as you'd normally do
  (`0301_create_todo.sql`, `0302_add_todo_index.sql`, …).
- Plans that don't add schema simply don't use their block.

## Plan index

### Foundation plans

| ID  | Title                                       | Status        | Migration block |
| --- | ------------------------------------------- | ------------- | --------------- |
| F1  | [Idempotency middleware + crons](./foundation-idempotency-crons.md) | ⏳ Not started | 0100–0199 |
| F2  | [Email provider (Resend / MailChannels)](./foundation-email-provider.md) | ⏳ Not started | — |
| F3  | [Image processing on Cloudflare Images](./foundation-image-processing.md) | ⏳ Not started | — |
| F4  | [WebSocket client wiring + ephemeral tokens](./foundation-websocket-wiring.md) | ⏳ Not started | 0200–0299 |
| F5  | [MCP fetch-based transport](./foundation-mcp-transport.md) | ⏳ Not started | — |
| F6  | [Backup / restore with fflate + R2](./foundation-backup-restore.md) | ⏳ Not started | — |

### Route-prefix plans

| ID  | Prefix              | Status        | Migration block |
| --- | ------------------- | ------------- | --------------- |
| R1  | [publicConfig](./port-publicConfig.md)    | ✅ Done (2026-06-16) | 0300–0399 |
| R2  | [settings](./port-settings.md)            | ✅ Done (2026-06-16) | 0400–0499 |
| R3  | [tags](./port-tags.md)                    | ✅ Done (2026-06-16) | 0500–0599 |
| R4  | [categories](./port-categories.md)        | ✅ Done (2026-06-16) | 0600–0699 |
| R5  | [airports](./port-airports.md)            | ⏳ Not started | 0700–0799 |
| R6  | [atlas](./port-atlas.md)                  | ⏳ Not started | 0800–0899 |
| R7  | [weather](./port-weather.md)              | ⏳ Not started | 0900–0999 |
| R8  | [systemNotices](./port-systemNotices.md)  | ⏳ Not started | 1000–1099 |
| R9  | [days + dayNotes](./port-days.md)         | ⏳ Not started | 1100–1199 |
| R10 | [places](./port-places.md)                | ⏳ Not started | 1200–1299 |
| R11 | [assignments](./port-assignments.md)      | ⏳ Not started | 1300–1399 |
| R12 | [packing](./port-packing.md)              | ⏳ Not started | 1400–1499 |
| R13 | [todo](./port-todo.md)                    | ⏳ Not started | 1500–1599 |
| R14 | [reservations](./port-reservations.md)    | ⏳ Not started | 1600–1699 |
| R15 | [budget](./port-budget.md)                | ⏳ Not started | 1700–1799 |
| R16 | [share](./port-share.md)                  | ⏳ Not started | 1800–1899 |
| R17 | [maps](./port-maps.md)                    | ⏳ Not started | 1900–1999 |
| R18 | [collab](./port-collab.md)                | ⏳ Not started | 2000–2099 |
| R19 | [photos + memories](./port-photos.md)     | ⏳ Not started | 2100–2199 |
| R20 | [notifications](./port-notifications.md)  | ⏳ Not started | 2200–2299 |
| R21 | [journey + journeyPublic](./port-journey.md) | ⏳ Not started | 2300–2399 |
| R22 | [vacay](./port-vacay.md)                  | ⏳ Not started | 2400–2499 |
| R23 | [oauth](./port-oauth.md)                  | ⏳ Not started | 2500–2599 |
| R24 | [oidc](./port-oidc.md)                    | ⏳ Not started | 2600–2699 |
| R25 | [admin](./port-admin.md)                  | ⏳ Not started | 2700–2799 |

## Independence

These plans are designed to compile, test, and deploy independently:

- Each route plan removes its own prefix from the `STUBBED_PREFIXES` array
  in `worker/src/index.ts` and mounts its own router. Two agents touching
  the same file in different prefixes is a trivial git merge — the SPA
  prefix list is a list of strings, not a single function.
- Each plan owns its own D1 migration number range. Migration files added
  by different plans never collide.
- Tests live under `worker/tests/integration/<prefix>.test.ts` — one file
  per plan, no shared mutable state across files (each test file gets a
  fresh Miniflare D1).
- Foundation plans don't block route plans. Where a route plan would
  benefit from a foundation piece (e.g. R20 notifications wants F2 email),
  the route plan ships with a stub that returns a clear `501 EMAIL_NOT_CONFIGURED`
  until F2 lands. This keeps each plan landable on its own.

## Out of scope for these plans

The same items the parent PRD (issue #2) lists as out-of-scope: multi-region
deployment, Express → D1 data import, removing the Express server,
Stripe/billing, perf tuning beyond the existing PWA config.
