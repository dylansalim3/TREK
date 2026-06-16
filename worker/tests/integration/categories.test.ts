import { describe, it, expect, beforeEach } from 'vitest';
import { SELF, env, applyD1Migrations } from 'cloudflare:test';
import { createUser, createCategory, resetTestDb } from '../helpers/factories';
import { authHeader } from '../helpers/auth';
import initialSchema from '../../migrations/0001_initial_schema.sql?raw';
import { splitSql } from '../helpers/sql';

beforeEach(async () => {
  await applyD1Migrations(env.DB, [
    { name: '0001_initial_schema', queries: splitSql(initialSchema) },
  ]);
  await resetTestDb();
});

async function seedCategories(): Promise<void> {
  const defaults = [
    { name: 'Accommodation', color: '#ef4444', icon: '🏠' },
    { name: 'Food & Drink', color: '#f59e0b', icon: '🍽️' },
    { name: 'Nature', color: '#22c55e', icon: '🌿' },
    { name: 'Culture', color: '#8b5cf6', icon: '🎭' },
    { name: 'Museum', color: '#3b82f6', icon: '🏛️' },
    { name: 'Shopping', color: '#ec4899', icon: '🛍️' },
    { name: 'Nightlife', color: '#a855f7', icon: '🌃' },
    { name: 'Transport', color: '#06b6d4', icon: '🚌' },
    { name: 'Beach', color: '#14b8a6', icon: '🏖️' },
    { name: 'Hiking', color: '#84cc16', icon: '🥾' },
  ];
  for (const cat of defaults) {
    await createCategory(cat);
  }
}

describe('Categories', () => {
  it('CAT-001: GET /api/categories returns categories', async () => {
    await seedCategories();
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    const res = await SELF.fetch('https://example.com/api/categories', { headers });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(Array.isArray(body.categories)).toBe(true);
    expect(body.categories.length).toBeGreaterThanOrEqual(10);
    expect(body.categories[0]).toEqual(expect.objectContaining({
      name: expect.any(String),
      color: expect.any(String),
      icon: expect.any(String),
    }));
  });

  it('CAT-002: POST /api/categories - admin creates a new category', async () => {
    const { user: admin } = await createUser({ role: 'admin' });
    const headers = await authHeader(admin.id, { role: 'admin', email: admin.email, username: admin.username });

    const res = await SELF.fetch('https://example.com/api/categories', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Museum', color: '#7c3aed', icon: '🏛️' }),
    });

    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.category).toEqual(expect.objectContaining({
      name: 'Museum',
      color: '#7c3aed',
      icon: '🏛️',
    }));
    expect(body.category.id).toBeDefined();
  });

  it('CAT-003: POST /api/categories - non-admin returns 403', async () => {
    const { user } = await createUser({ role: 'user' });
    const headers = await authHeader(user.id, { role: 'user', email: user.email, username: user.username });

    const res = await SELF.fetch('https://example.com/api/categories', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Museum' }),
    });

    expect(res.status).toBe(403);
  });

  it('CAT-004: POST /api/categories - missing name returns 400', async () => {
    const { user: admin } = await createUser({ role: 'admin' });
    const headers = await authHeader(admin.id, { role: 'admin', email: admin.email, username: admin.username });

    const res = await SELF.fetch('https://example.com/api/categories', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ color: '#7c3aed' }),
    });

    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toBeDefined();
  });

  it('CAT-005: PUT /api/categories/:id - admin updates a category', async () => {
    const { user: admin } = await createUser({ role: 'admin' });
    const headers = await authHeader(admin.id, { role: 'admin', email: admin.email, username: admin.username });

    const createRes = await SELF.fetch('https://example.com/api/categories', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Old Name', color: '#aaaaaa', icon: '📌' }),
    });
    const createBody: any = await createRes.json();
    const catId = createBody.category.id;

    const res = await SELF.fetch(`https://example.com/api/categories/${catId}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name', color: '#bbbbbb' }),
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.category.name).toBe('New Name');
    expect(body.category.color).toBe('#bbbbbb');
    expect(body.category.icon).toBe('📌');
  });

  it('CAT-006: PUT /api/categories/:id - non-admin returns 403', async () => {
    const { user: admin } = await createUser({ role: 'admin' });
    const cat = await createCategory({ name: 'Adventure', color: '#22c55e', icon: '🧗' });
    const { user } = await createUser({ role: 'user' });
    const headers = await authHeader(user.id, { role: 'user', email: user.email, username: user.username });

    const res = await SELF.fetch(`https://example.com/api/categories/${cat.id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked' }),
    });

    expect(res.status).toBe(403);
  });

  it('CAT-007: PUT /api/categories/:id - non-existent category returns 404', async () => {
    const { user: admin } = await createUser({ role: 'admin' });
    const headers = await authHeader(admin.id, { role: 'admin', email: admin.email, username: admin.username });

    const res = await SELF.fetch('https://example.com/api/categories/99999', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ghost' }),
    });

    expect(res.status).toBe(404);
  });

  it('CAT-008: DELETE /api/categories/:id - admin deletes a category', async () => {
    const { user: admin } = await createUser({ role: 'admin' });
    const headers = await authHeader(admin.id, { role: 'admin', email: admin.email, username: admin.username });

    const createRes = await SELF.fetch('https://example.com/api/categories', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'To Delete' }),
    });
    const createBody: any = await createRes.json();
    const catId = createBody.category.id;

    const res = await SELF.fetch(`https://example.com/api/categories/${catId}`, {
      method: 'DELETE',
      headers,
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);

    const getRes = await SELF.fetch('https://example.com/api/categories', { headers });
    const getBody: any = await getRes.json();
    expect(getBody.categories.find((c: any) => c.id === catId)).toBeUndefined();
  });

  it('CAT-009: DELETE /api/categories/:id - non-admin returns 403', async () => {
    const cat = await createCategory({ name: 'Adventure', color: '#22c55e', icon: '🧗' });
    const { user } = await createUser({ role: 'user' });
    const headers = await authHeader(user.id, { role: 'user', email: user.email, username: user.username });

    const res = await SELF.fetch(`https://example.com/api/categories/${cat.id}`, {
      method: 'DELETE',
      headers,
    });

    expect(res.status).toBe(403);
  });

  it('CAT-010: GET /api/categories - unauthenticated returns 401', async () => {
    const res = await SELF.fetch('https://example.com/api/categories');
    expect(res.status).toBe(401);
  });
});
