# TREK on Cloudflare

This directory contains the Cloudflare Workers port of the TREK backend.
The original Node/Express server in `../server/` remains the source of truth;
this Worker is a parallel implementation that runs on Workers + D1 + R2 +
Durable Objects, with the static client (`../client/dist`) served from the
same Worker as static assets.

## Live deployment

- **App:** https://trek-api.dylansalim015.workers.dev (serves both client + API)
- **D1 database:** `trek-db` (id `e1a7ce42-497e-4abb-a9a1-a2c781c0c079`)
- **R2 bucket:** `trek-uploads`
- **Durable Object:** `TripRoom` (one instance per trip, for WebSocket collab)

## Architecture

```
                     ┌──────────────────────────────┐
   Browser  ───────▶ │   trek-api Worker (Hono)     │
                     │                              │
                     │   /            → ASSETS      │  ← built React/Vite app
                     │   /api/auth/*  → Hono router │
                     │   /api/trips/* → Hono router │
                     │   /api/files/* → Hono router │ ─┐
                     │   /ws/:tripId  → TripRoom DO │  │
                     │   scheduled()  → cron jobs   │  │
                     └──────────────────────────────┘  │
                              │              │         │
                              ▼              ▼         ▼
                          ┌──────┐       ┌──────┐  ┌──────┐
                          │  D1  │       │  DO  │  │  R2  │
                          └──────┘       └──────┘  └──────┘
```

## What's migrated

| Component                  | Status         | Notes |
| -------------------------- | -------------- | ----- |
| Static client (Vite)       | ✅ Done        | Served via Worker `[assets]`, SPA fallback handled. |
| D1 schema (base tables)    | ✅ Done        | `migrations/0001_initial_schema.sql` (39 tables). |
| `POST /api/auth/register`  | ✅ Done        | bcryptjs hash, first-user-is-admin behavior preserved. |
| `POST /api/auth/login`     | ✅ Done        | JWT via `jose`, sets `password_version` claim. |
| `GET  /api/auth/me`        | ✅ Done        | |
| `GET/POST/PATCH/DELETE /api/trips` | ✅ Done | Owner + trip_members access checks. |
| `POST /api/files/upload`   | ✅ Done        | multipart → R2, records to `trip_files`. |
| `GET  /api/files/:key`     | ✅ Done        | Authenticated R2 download. |
| WebSocket collab           | ✅ Scaffolded  | `TripRoom` DO with hibernation, `/ws/:tripId` route. |
| Scheduled tasks            | ⚠ Stubbed     | `scheduled()` handler registered; jobs not ported. |
| All other `/api/*` routes  | 🟥 Stubbed (501) | See `STUBBED_PREFIXES` in `src/index.ts`. |

## What's NOT migrated yet

The Express server has ~25K LoC of routes and services. The remaining work is
roughly:

1. **Schema migrations (2,290 lines)** — `server/src/db/migrations.ts` adds
   ~50 incremental migrations on top of the base schema (todo, journey,
   memories, OAuth, MCP, OIDC, packing bags, vacay calendars, etc.). These
   need to be ported as additional `.sql` files in `worker/migrations/`.

2. **Route handlers (28 files, ~14K LoC)** — each stubbed prefix in
   `src/index.ts` needs a Hono router built from the corresponding
   `server/src/routes/*.ts` file, with its `server/src/services/*` translated
   to D1 queries.

3. **Email** — `nodemailer` won't run on Workers. Pick an HTTP-based provider
   (Resend, MailChannels, Postmark) and replace usages in
   `server/src/services/notifications.ts`.

4. **Image processing** — `jimp` (used for avatar/cover thumbnails) is a
   native Node module. On Workers, use Cloudflare Images or a server-side
   Image Resizing transform.

5. **Backups** — `archiver`/`unzipper` (zip streaming) need a Workers-friendly
   replacement (e.g. `fflate`), with backup blobs stored in R2.

6. **MCP server** — `@modelcontextprotocol/sdk` uses Node's `http`. Workers
   has a native fetch-based variant; needs an SSE/HTTP transport adapter.

7. **OAuth/OIDC** — `server/src/routes/oauth.ts` + `oidc.ts` rely on
   `oauth2-server`-style middleware. Port to `hono/oauth-providers` or build a
   Workers-native flow.

## Local development

Top-level `Makefile` covers the common loop. From the repo root:

```bash
make install         # install client + worker deps
make dev             # start Vite against the dev Cloudflare backend (default)
make dev-worker      # alternatively: run wrangler dev locally on :8787
make test            # client + worker tests
```

If you prefer the Vite proxy → local Worker setup, run `make dev-worker` in
one terminal and `make dev-client` in another, after unsetting
`VITE_API_URL` in `client/.env.development` (or override in `.env.local`).

## Deploying

Pushing to **`dev`** auto-deploys `trek-api-dev` via
`.github/workflows/deploy-dev.yml`. Pushing to **`main`** auto-deploys
`trek-api` via `.github/workflows/deploy-prod.yml`. Both workflows build
the client, run worker tests, apply D1 migrations, then `wrangler deploy`
with the matching `--env`.

Manual deploy:

```bash
make deploy-dev      # build client + deploy worker to trek-api-dev
make deploy-prod     # same, to trek-api (prod)
```

CI needs two GitHub secrets per environment
(`cloudflare-dev`, `cloudflare-prod`):

- `CLOUDFLARE_API_TOKEN` — token with Workers + D1 + R2 write access
- `CLOUDFLARE_ACCOUNT_ID`

## First-time setup (per account)

```bash
make cf-login                   # interactive wrangler login
make cf-setup-prod              # create trek-db + trek-uploads
make cf-setup-dev               # create trek-db-dev + trek-uploads-dev
# Copy the printed database_id values into worker/wrangler.toml under
# [[d1_databases]] and [[env.dev.d1_databases]] / [[env.prod.d1_databases]].
echo -n "<jwt-signing-secret>" | (cd worker && npx wrangler secret put JWT_SECRET --env prod)
echo -n "<jwt-signing-secret>" | (cd worker && npx wrangler secret put JWT_SECRET --env dev)
```

## Secrets

- `JWT_SECRET` — token signing key, per env (`wrangler secret put JWT_SECRET --env dev|prod`).
- Provider-specific keys per the in-progress execution plans
  (`RESEND_API_KEY`, `GOOGLE_MAPS_API_KEY`, etc.) live in the same place.
