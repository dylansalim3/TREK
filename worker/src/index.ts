// TREK API on Cloudflare Workers (Hono + D1 + R2 + Durable Objects).
//
// Status: scaffold for the cloudflare-migration branch. The Express server
// in /server is the source of truth — this Worker currently implements
// auth + trips + files as a working proof, and returns 501 for routes that
// haven't been ported yet. See worker/README.md for the migration matrix.

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import tripRoutes from './routes/trips';
import fileRoutes from './routes/files';
import categoryRoutes from './routes/categories';
import tagRoutes from './routes/tags';
import publicConfigRoutes from './routes/publicConfig';
import settingsRoutes from './routes/settings';
import type { AppVariables, Env } from './types';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use('*', cors({
  origin: (origin, c) => {
    const allowed = c.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) ?? [];
    if (allowed.length === 0) return origin ?? '*';
    return allowed.includes(origin ?? '') ? origin! : '';
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type', 'X-Idempotency-Key'],
}));

app.get('/health', (c) =>
  c.json({ status: 'ok', service: c.env.APP_NAME ?? 'TREK', runtime: 'cloudflare-workers' }),
);

app.route('/api/auth', authRoutes);
app.route('/api/trips', tripRoutes);
app.route('/api/files', fileRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/tags', tagRoutes);
app.route('/api/config', publicConfigRoutes);
app.route('/api/settings', settingsRoutes);

// Stub all routes that haven't been migrated from /server yet.
// Each returns 501 with the corresponding source file so the client can fail loudly.
const STUBBED_PREFIXES = [
  'admin', 'airports', 'assignments', 'atlas', 'backup', 'budget',
  'collab', 'dayNotes', 'days', 'journey', 'maps',
  'memories', 'notifications', 'oauth', 'oidc', 'packing', 'photos',
  'places', 'reservations', 'share',
  'systemNotices', 'todo', 'vacay', 'weather',
];
for (const prefix of STUBBED_PREFIXES) {
  app.all(`/api/${prefix}/*`, (c) =>
    c.json(
      {
        error: 'Not migrated',
        message: `Route prefix /api/${prefix} not yet ported to Workers. See server/src/routes/${prefix}.ts`,
      },
      501,
    ),
  );
}

// WebSocket: route /ws/:tripId to the TripRoom Durable Object.
app.get('/ws/:tripId', async (c) => {
  if (c.req.header('Upgrade') !== 'websocket') {
    return c.json({ error: 'Expected WebSocket upgrade' }, 426);
  }
  const tripId = c.req.param('tripId');
  const id = c.env.TRIP_ROOM.idFromName(tripId);
  const stub = c.env.TRIP_ROOM.get(id);
  return stub.fetch(c.req.raw);
});

app.notFound(async (c) => {
  const { pathname } = new URL(c.req.url);
  // API and WS paths that don't match should return JSON 404.
  if (pathname.startsWith('/api/') || pathname.startsWith('/ws/')) {
    return c.json({ error: 'Not found' }, 404);
  }
  // All other paths are SPA routes — serve the root (index.html) from assets.
  const rootUrl = new URL('/', c.req.url).toString();
  return c.env.ASSETS.fetch(new Request(rootUrl, { method: 'GET', headers: c.req.raw.headers }));
});

app.onError((err, c) => {
  console.error('Unhandled error', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

export default {
  fetch: app.fetch,
  // Scheduled tasks replace node-cron (see wrangler.toml [triggers]).
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log('Scheduled trigger', event.cron, new Date(event.scheduledTime).toISOString());
    // TODO: port server/src/scheduler.ts jobs:
    //   - idempotency cleanup
    //   - ephemeral token cleanup
    //   - trip reminders
    //   - todo reminders
    //   - demo reset
    //   - trek photo cache cleanup
    //   - version check
    void env;
  },
};

export { TripRoom } from './durable/tripRoom';
