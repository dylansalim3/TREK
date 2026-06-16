import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import type { AppVariables, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use('*', requireAuth);

app.get('/', async (c) => {
  const user = c.get('user')!;
  const rows = await c.env.DB.prepare(
    'SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC',
  )
    .bind(user.sub)
    .all();
  return c.json({ tags: rows.results ?? [] });
});

app.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const { name, color } = body ?? {};

  if (!name) return c.json({ error: 'Tag name is required' }, 400);

  const user = c.get('user')!;
  const result = await c.env.DB.prepare(
    'INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?) RETURNING *',
  )
    .bind(user.sub, name, color ?? '#10b981')
    .first();
  if (!result) return c.json({ error: 'Failed to create tag' }, 500);

  return c.json({ tag: result }, 201);
});

app.put('/:id', async (c) => {
  const user = c.get('user')!;
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare(
    'SELECT * FROM tags WHERE id = ? AND user_id = ?',
  )
    .bind(id, user.sub)
    .first();
  if (!existing) return c.json({ error: 'Tag not found' }, 404);

  const body = await c.req.json().catch(() => null);
  const { name, color } = body ?? {};

  const tag = existing as Record<string, unknown>;
  const newName = name ?? tag.name;
  const newColor = color ?? tag.color;

  const updated = await c.env.DB.prepare(
    'UPDATE tags SET name = ?, color = ? WHERE id = ? RETURNING *',
  )
    .bind(newName, newColor, id)
    .first();
  if (!updated) return c.json({ error: 'Failed to update tag' }, 500);

  return c.json({ tag: updated });
});

app.delete('/:id', async (c) => {
  const user = c.get('user')!;
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare(
    'SELECT * FROM tags WHERE id = ? AND user_id = ?',
  )
    .bind(id, user.sub)
    .first();
  if (!existing) return c.json({ error: 'Tag not found' }, 404);

  await c.env.DB.prepare('DELETE FROM tags WHERE id = ?')
    .bind(id)
    .run();
  return c.json({ success: true });
});

export default app;
