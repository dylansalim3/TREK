import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import type { AppVariables, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use('*', requireAuth);

app.get('/', async (c) => {
  const user = c.get('user')!;
  const rows = await c.env.DB.prepare(
    'SELECT key, value FROM settings WHERE user_id = ?',
  )
    .bind(user.sub)
    .all<{ key: string; value: string }>();

  const settings: Record<string, unknown> = {};
  const maskedKeys = new Set(['webhook_url', 'ntfy_token']);
  for (const row of rows.results ?? []) {
    if (maskedKeys.has(row.key)) {
      settings[row.key] = row.value ? '••••••••' : '';
      continue;
    }
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }

  return c.json({ settings });
});

app.put('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const { key, value } = body ?? {};

  if (!key) return c.json({ error: 'Key is required' }, 400);

  if (value === '••••••••') return c.json({ success: true, key, unchanged: true });

  const user = c.get('user')!;
  const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value !== undefined ? value : '');

  await c.env.DB.prepare(
    `INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
     ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`,
  )
    .bind(user.sub, key, serialized)
    .run();

  return c.json({ success: true, key, value });
});

app.post('/bulk', async (c) => {
  const body = await c.req.json().catch(() => null);
  const { settings } = body ?? {};

  if (!settings || typeof settings !== 'object') {
    return c.json({ error: 'Settings object is required' }, 400);
  }

  const user = c.get('user')!;
  const entries = Object.entries(settings as Record<string, unknown>);
  const stmt = c.env.DB.prepare(
    `INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
     ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`,
  );

  const batch = entries.map(([key, value]) => {
    const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value !== undefined ? value : '');
    return stmt.bind(user.sub, key, serialized);
  });
  await c.env.DB.batch(batch);

  return c.json({ success: true, updated: entries.length });
});

export default app;
