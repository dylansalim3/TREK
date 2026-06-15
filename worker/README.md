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

```bash
# In worker/
npm install
source /tmp/cf-env.sh           # or: export CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=…
npm run db:migrate:local        # apply base schema to local D1 sim
npm run dev                     # wrangler dev on :8787
```

## Deploying

```bash
# Build the client (output goes to client/dist, which the Worker serves)
cd ../client && npm run build

cd ../worker
npm run db:migrate:remote       # apply any new migrations
npm run deploy
```

## Secrets

```bash
echo -n "<jwt-signing-secret>" | wrangler secret put JWT_SECRET
```

Already set on the live deployment. Rotate by re-running the command.
