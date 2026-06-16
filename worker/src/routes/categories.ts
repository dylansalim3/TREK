import { Hono } from 'hono';
import { requireAuth, adminOnly } from '../middleware/auth';
import type { AppVariables, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use('*', requireAuth);

app.get('/', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM categories ORDER BY name ASC',
  ).all();
  return c.json({ categories: rows.results ?? [] });
});

app.post('/', adminOnly, async (c) => {
  const body = await c.req.json().catch(() => null);
  const { name, color, icon } = body ?? {};

  if (!name) return c.json({ error: 'Category name is required' }, 400);

  const user = c.get('user')!;
  const result = await c.env.DB.prepare(
    'INSERT INTO categories (name, color, icon, user_id) VALUES (?, ?, ?, ?) RETURNING *',
  )
    .bind(name, color ?? '#6366f1', icon ?? '\uD83D\uDCCD', user.sub)
    .first();
  if (!result) return c.json({ error: 'Failed to create category' }, 500);

  return c.json({ category: result }, 201);
});

app.put('/:id', adminOnly, async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare(
    'SELECT * FROM categories WHERE id = ?',
  )
    .bind(id)
    .first();
  if (!existing) return c.json({ error: 'Category not found' }, 404);

  const body = await c.req.json().catch(() => null);
  const { name, color, icon } = body ?? {};

  const cat = existing as Record<string, unknown>;
  const newName = name ?? cat.name;
  const newColor = color ?? cat.color;
  const newIcon = icon ?? cat.icon;

  const updated = await c.env.DB.prepare(
    'UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ? RETURNING *',
  )
    .bind(newName, newColor, newIcon, id)
    .first();
  if (!updated) return c.json({ error: 'Failed to update category' }, 500);

  return c.json({ category: updated });
});

app.delete('/:id', adminOnly, async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare(
    'SELECT * FROM categories WHERE id = ?',
  )
    .bind(id)
    .first();
  if (!existing) return c.json({ error: 'Category not found' }, 404);

  await c.env.DB.prepare('DELETE FROM categories WHERE id = ?')
    .bind(id)
    .run();
  return c.json({ success: true });
});

export default app;
