# F1 — Idempotency middleware + scheduled crons

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 0100–0199
**Blocked by:** none
**Blocks:** none (route plans degrade gracefully without this)

## Goal

The Express server deduplicates retried mutations via the
`X-Idempotency-Key` header and runs a node-cron scheduler. Port both to the
Worker so retries are safe and background jobs run on Cloudflare's Cron
Triggers.

## Scope

- [ ] Migration `0100_idempotency_keys.sql`:
  ```sql
  CREATE TABLE idempotency_keys (
    key TEXT PRIMARY KEY,
    user_id INTEGER,
    response_body TEXT NOT NULL,
    response_status INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_idempotency_keys_created ON idempotency_keys(created_at);
  ```
- [ ] `worker/src/middleware/idempotency.ts`: Hono middleware that, on any
      mutating request with an `X-Idempotency-Key` header, returns the
      cached response if the key exists; otherwise runs the handler and
      stores the response.
- [ ] Apply the middleware in `worker/src/index.ts` on all `/api/*` routes
      after auth.
- [ ] Flesh out `scheduled()` in `worker/src/index.ts` to dispatch on
      `event.cron`:
  - `*/15 * * * *` → `cleanupIdempotencyKeys()`, `cleanupEphemeralTokens()`
  - `0 * * * *`     → `cleanupPhotoCache()`, `checkVersion()` (debounced
                      once-per-day via a `KV`/`D1` flag)
  - `0 8 * * *`     → `sendTripReminders()`, `sendTodoReminders()`,
                      `demoReset()` (gated on `APP_ENV` or `DEMO_MODE`)
- [ ] Tests:
  - Fire two identical `POST` requests with the same idempotency key,
    assert second returns the cached body without re-running the handler.
  - Invoke `scheduled()` with each cron string, assert side-effects on D1.

## Source references

- Idempotency in Express: `server/src/middleware/idempotency.ts`
- Cron jobs: `server/src/scheduler.ts`
- Cron triggers config: `worker/wrangler.toml` `[triggers]`

## Done-when

Tests green + a `wrangler tail --env dev` run shows the cron handlers
firing on schedule.
