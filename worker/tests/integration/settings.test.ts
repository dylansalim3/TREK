import { describe, it, expect, beforeEach } from 'vitest';
import { SELF, env, applyD1Migrations } from 'cloudflare:test';
import { createUser, resetTestDb } from '../helpers/factories';
import { authHeader } from '../helpers/auth';
import initialSchema from '../../migrations/0001_initial_schema.sql?raw';
import { splitSql } from '../helpers/sql';

beforeEach(async () => {
  await applyD1Migrations(env.DB, [
    { name: '0001_initial_schema', queries: splitSql(initialSchema) },
  ]);
  await resetTestDb();
});

describe('Settings', () => {
  it('SET-001: GET /api/settings returns empty object for new user', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    const res = await SELF.fetch('https://example.com/api/settings', { headers });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.settings).toBeDefined();
    expect(typeof body.settings).toBe('object');
    expect(Object.keys(body.settings)).toHaveLength(0);
  });

  it('SET-002: PUT /api/settings sets a key/value pair', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    const res = await SELF.fetch('https://example.com/api/settings', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'theme', value: 'dark' }),
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.key).toBe('theme');
    expect(body.value).toBe('dark');
  });

  it('SET-003: PUT /api/settings updates an existing key', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    await SELF.fetch('https://example.com/api/settings', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'theme', value: 'dark' }),
    });

    const res = await SELF.fetch('https://example.com/api/settings', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'theme', value: 'light' }),
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.value).toBe('light');

    const getRes = await SELF.fetch('https://example.com/api/settings', { headers });
    const getBody: any = await getRes.json();
    expect(getBody.settings.theme).toBe('light');
  });

  it('SET-004: POST /api/settings/bulk upserts multiple settings', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    const res = await SELF.fetch('https://example.com/api/settings/bulk', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { theme: 'dark', language: 'en', compact_mode: 'true' } }),
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.updated).toBeGreaterThanOrEqual(3);
  });

  it('SET-005: GET /api/settings reflects previously upserted values', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    await SELF.fetch('https://example.com/api/settings/bulk', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { theme: 'dark', language: 'fr' } }),
    });

    const res = await SELF.fetch('https://example.com/api/settings', { headers });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.settings.theme).toBe('dark');
    expect(body.settings.language).toBe('fr');
  });

  it('SET-006: GET /api/settings without auth returns 401', async () => {
    const res = await SELF.fetch('https://example.com/api/settings');
    expect(res.status).toBe(401);
  });

  it('SET-007: PUT /api/settings without key returns 400', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    const res = await SELF.fetch('https://example.com/api/settings', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 'dark' }),
    });

    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toBeDefined();
  });

  it('SET-008: PUT /api/settings with masked value is ignored (no-op)', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    await SELF.fetch('https://example.com/api/settings', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'webhook_url', value: 'https://example.com/hook' }),
    });

    const res = await SELF.fetch('https://example.com/api/settings', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'webhook_url', value: '••••••••' }),
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.unchanged).toBe(true);
  });

  it('SET-009: POST /api/settings/bulk without settings object returns 400', async () => {
    const { user } = await createUser();
    const headers = await authHeader(user.id, { role: user.role, email: user.email, username: user.username });

    const res = await SELF.fetch('https://example.com/api/settings/bulk', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: null }),
    });

    expect(res.status).toBe(400);
  });

  it('SET-010: settings are user-scoped (user A cannot see user B settings)', async () => {
    const { user: userA } = await createUser();
    const { user: userB } = await createUser();

    const headersA = await authHeader(userA.id, { role: userA.role, email: userA.email, username: userA.username });
    await SELF.fetch('https://example.com/api/settings', {
      method: 'PUT',
      headers: { ...headersA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'secret_setting', value: 'user_a_secret' }),
    });

    const headersB = await authHeader(userB.id, { role: userB.role, email: userB.email, username: userB.username });
    const res = await SELF.fetch('https://example.com/api/settings', { headers: headersB });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.settings.secret_setting).toBeUndefined();
  });
});
