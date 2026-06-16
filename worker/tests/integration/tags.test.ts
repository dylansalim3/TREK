import { describe, it, expect, beforeEach } from 'vitest';
import { SELF, env, applyD1Migrations } from 'cloudflare:test';
import { createUser, createTag, resetTestDb } from '../helpers/factories';
import { authHeader } from '../helpers/auth';
import initialSchema from '../../migrations/0001_initial_schema.sql?raw';
import { splitSql } from '../helpers/sql';

beforeEach(async () => {
  await applyD1Migrations(env.DB, [
    { name: '0001_initial_schema', queries: splitSql(initialSchema) },
  ]);
  await resetTestDb();
});

describe('Tags', () => {
  it('TAG-001: GET /api/tags returns empty array for new user', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    const res = await SELF.fetch('https://example.com/api/tags', { headers });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.tags).toEqual([]);
  });

  it('TAG-002: POST /api/tags creates a tag with default color', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    const res = await SELF.fetch('https://example.com/api/tags', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Must See' }),
    });

    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.tag).toEqual(expect.objectContaining({ name: 'Must See', user_id: user.id }));
    expect(body.tag.id).toBeDefined();
    expect(body.tag.color).toBe('#10b981');
  });

  it('TAG-003: POST /api/tags creates a tag with a custom color', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    const res = await SELF.fetch('https://example.com/api/tags', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Foodie', color: '#f59e0b' }),
    });

    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.tag.color).toBe('#f59e0b');
  });

  it('TAG-004: POST /api/tags without name returns 400', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    const res = await SELF.fetch('https://example.com/api/tags', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ color: '#ff0000' }),
    });

    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toBeDefined();
  });

  it('TAG-005: PUT /api/tags/:id updates tag name and color', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    const createRes = await SELF.fetch('https://example.com/api/tags', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Old Name', color: '#aaaaaa' }),
    });
    const createBody: any = await createRes.json();
    const tagId = createBody.tag.id;

    const res = await SELF.fetch(`https://example.com/api/tags/${tagId}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name', color: '#bbbbbb' }),
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.tag.name).toBe('New Name');
    expect(body.tag.color).toBe('#bbbbbb');
  });

  it('TAG-006: PUT /api/tags/:id - tag belonging to another user returns 404', async () => {
    const { user: userA } = await createUser();
    const tag = await createTag(userA.id, { name: 'User A Tag' });
    const { user: userB } = await createUser();
    const headers = await authHeader(userB.id, { role: userB.role, email: userB.email, username: userB.username });

    const res = await SELF.fetch(`https://example.com/api/tags/${tag.id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hijacked' }),
    });

    expect(res.status).toBe(404);
  });

  it('TAG-007: DELETE /api/tags/:id removes the tag', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    const createRes = await SELF.fetch('https://example.com/api/tags', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'To Delete' }),
    });
    const createBody: any = await createRes.json();
    const tagId = createBody.tag.id;

    const res = await SELF.fetch(`https://example.com/api/tags/${tagId}`, {
      method: 'DELETE',
      headers,
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);

    const listRes = await SELF.fetch('https://example.com/api/tags', { headers });
    const listBody: any = await listRes.json();
    expect(listBody.tags).toHaveLength(0);
  });

  it('TAG-008: DELETE /api/tags/:id - tag belonging to another user returns 404', async () => {
    const { user: userA } = await createUser();
    const tag = await createTag(userA.id, { name: 'User A Tag' });
    const { user: userB } = await createUser();
    const headers = await authHeader(userB.id, { role: userB.role, email: userB.email, username: userB.username });

    const res = await SELF.fetch(`https://example.com/api/tags/${tag.id}`, {
      method: 'DELETE',
      headers,
    });

    expect(res.status).toBe(404);
  });

  it('TAG-009: Tags are user-scoped — user A cannot see user B tags', async () => {
    const { user: userA } = await createUser();
    const { user: userB } = await createUser();

    const headersA = await authHeader(userA.id, { role: userA.role, email: userA.email, username: userA.username });
    await SELF.fetch('https://example.com/api/tags', {
      method: 'POST',
      headers: { ...headersA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A Private Tag' }),
    });

    const headersB = await authHeader(userB.id, { role: userB.role, email: userB.email, username: userB.username });
    const res = await SELF.fetch('https://example.com/api/tags', { headers: headersB });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.tags).toHaveLength(0);
  });

  it('TAG-010: Unauthenticated request returns 401', async () => {
    const res = await SELF.fetch('https://example.com/api/tags');
    expect(res.status).toBe(401);
  });
});
