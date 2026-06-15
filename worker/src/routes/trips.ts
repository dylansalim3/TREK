import { Hono } from 'hono';
import { z } from 'zod';
import type { AppVariables, Env } from '../types';
import { requireAuth } from '../middleware/auth';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const tripCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  currency: z.string().optional(),
  cover_image: z.string().optional(),
});

const tripUpdateSchema = tripCreateSchema.partial();

// Auth required for everything in this router.
app.use('*', requireAuth);

app.get('/', async (c) => {
  const user = c.get('user')!;
  const rows = await c.env.DB.prepare(
    `SELECT t.* FROM trips t
     WHERE t.user_id = ? OR EXISTS(
       SELECT 1 FROM trip_members m WHERE m.trip_id = t.id AND m.user_id = ?
     )
     ORDER BY t.created_at DESC`,
  )
    .bind(user.sub, user.sub)
    .all();
  return c.json(rows.results ?? []);
});

app.post('/', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => null);
  const parsed = tripCreateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);

  const { title, description, start_date, end_date, currency, cover_image } = parsed.data;
  const result = await c.env.DB.prepare(
    `INSERT INTO trips (user_id, title, description, start_date, end_date, currency, cover_image)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
  )
    .bind(user.sub, title, description ?? null, start_date ?? null, end_date ?? null, currency ?? 'EUR', cover_image ?? null)
    .first();
  return c.json(result, 201);
});

app.get('/:id', async (c) => {
  const user = c.get('user')!;
  const id = Number(c.req.param('id'));
  const trip = await c.env.DB.prepare(
    `SELECT t.* FROM trips t
     WHERE t.id = ?
       AND (t.user_id = ? OR EXISTS(SELECT 1 FROM trip_members m WHERE m.trip_id = t.id AND m.user_id = ?))
     LIMIT 1`,
  )
    .bind(id, user.sub, user.sub)
    .first();
  if (!trip) return c.json({ error: 'Trip not found' }, 404);
  return c.json(trip);
});

app.patch('/:id', async (c) => {
  const user = c.get('user')!;
  const id = Number(c.req.param('id'));
  const body = await c.req.json().catch(() => null);
  const parsed = tripUpdateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Invalid input' }, 400);

  const owns = await c.env.DB.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?')
    .bind(id, user.sub)
    .first();
  if (!owns) return c.json({ error: 'Forbidden' }, 403);

  const fields = Object.entries(parsed.data).filter(([, v]) => v !== undefined);
  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400);
  const setClause = fields.map(([k]) => `${k} = ?`).join(', ');
  const values = fields.map(([, v]) => v);

  const updated = await c.env.DB.prepare(
    `UPDATE trips SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`,
  )
    .bind(...values, id)
    .first();
  return c.json(updated);
});

app.delete('/:id', async (c) => {
  const user = c.get('user')!;
  const id = Number(c.req.param('id'));
  const owns = await c.env.DB.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?')
    .bind(id, user.sub)
    .first();
  if (!owns) return c.json({ error: 'Forbidden' }, 403);
  await c.env.DB.prepare('DELETE FROM trips WHERE id = ?').bind(id).run();
  return c.body(null, 204);
});

export default app;
