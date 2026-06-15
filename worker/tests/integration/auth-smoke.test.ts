import { describe, it, expect, beforeEach } from 'vitest';
import { SELF, env, applyD1Migrations } from 'cloudflare:test';
import { createUser, resetTestDb } from '../helpers/factories';
import initialSchema from '../../migrations/0001_initial_schema.sql?raw';
import { splitSql } from '../helpers/sql';

beforeEach(async () => {
  await applyD1Migrations(env.DB, [
    { name: '0001_initial_schema', queries: splitSql(initialSchema) },
  ]);
  await resetTestDb();
});

describe('Auth smoke test', () => {
  it('POST /api/auth/register returns 201 with token and user', async () => {
    const res = await SELF.fetch('https://example.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'smoketest',
        email: 'smoke@test.example.com',
        password: 'SmokeTest123!',
      }),
    });

    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.token).toBeDefined();
    expect(body.user.username).toBe('smoketest');
    expect(body.user.email).toBe('smoke@test.example.com');
    expect(body.user.role).toBe('admin');
  });

  it('POST /api/auth/login returns 200 with token', async () => {
    const { user, password } = await createUser({ role: 'user' });

    const res = await SELF.fetch('https://example.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password }),
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe(user.email);
    expect(body.user.password_hash).toBeUndefined();
  });

  it('GET /api/auth/me returns 401 without token', async () => {
    const res = await SELF.fetch('https://example.com/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me returns user with valid token', async () => {
    const { user, password } = await createUser();

    const loginRes = await SELF.fetch('https://example.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password }),
    });
    const loginBody: any = await loginRes.json();
    const token = loginBody.token as string;

    const res = await SELF.fetch('https://example.com/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.email).toBe(user.email);
  });

  it('stubbed routes return 501', async () => {
    const res = await SELF.fetch('https://example.com/api/places/1');
    expect(res.status).toBe(501);
    const body: any = await res.json();
    expect(body.error).toBe('Not migrated');
  });

  it('GET /health returns ok', async () => {
    const res = await SELF.fetch('https://example.com/health');
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.status).toBe('ok');
    expect(body.runtime).toBe('cloudflare-workers');
  });
});
