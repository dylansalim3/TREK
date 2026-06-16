import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { AppVariables, Env } from '../types';
import { requireAuth, signToken } from '../middleware/auth';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  password_version: number;
  mfa_enabled: number;
  must_change_password: number;
}

app.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);

  const { username, email, password } = parsed.data;

  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
  )
    .bind(email, username)
    .first<{ id: number }>();
  if (existing) return c.json({ error: 'User already exists' }, 409);

  const password_hash = await bcrypt.hash(password, 10);

  // First user becomes admin (matches Express behavior)
  const count = await c.env.DB.prepare('SELECT COUNT(*) as n FROM users').first<{ n: number }>();
  const role = (count?.n ?? 0) === 0 ? 'admin' : 'user';

  const result = await c.env.DB.prepare(
    `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?) RETURNING id`,
  )
    .bind(username, email, password_hash, role)
    .first<{ id: number }>();
  if (!result) return c.json({ error: 'Failed to create user' }, 500);

  const token = await signToken(c.env, {
    sub: result.id,
    email,
    username,
    role,
    pv: 0,
  });
  return c.json({ token, user: { id: result.id, username, email, role } }, 201);
});

app.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Invalid input' }, 400);

  const { email, password } = parsed.data;
  const user = await c.env.DB.prepare(
    `SELECT id, username, email, password_hash, role, password_version, mfa_enabled, must_change_password
     FROM users WHERE email = ? LIMIT 1`,
  )
    .bind(email)
    .first<UserRow>();
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return c.json({ error: 'Invalid credentials' }, 401);

  await c.env.DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(user.id)
    .run();

  const token = await signToken(c.env, {
    sub: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    pv: user.password_version,
  });
  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      mfa_enabled: !!user.mfa_enabled,
      must_change_password: !!user.must_change_password,
    },
  });
});

app.get('/app-config', async (c) => {
  const count = await c.env.DB.prepare('SELECT COUNT(*) as n FROM users').first<{ n: number }>();
  const hasUsers = (count?.n ?? 0) > 0;

  const getSetting = async (key: string) =>
    (await c.env.DB.prepare('SELECT value FROM app_settings WHERE key = ? LIMIT 1').bind(key).first<{ value: string }>())?.value ?? null;

  const allowReg = (await getSetting('allow_registration')) ?? 'true';
  const passwordReg = (await getSetting('password_registration')) ?? null;
  // password_registration key overrides allow_registration when present
  const registrationEnabled = passwordReg !== null ? passwordReg !== 'false' : allowReg !== 'false';

  const isDemo = c.env.APP_ENV === 'demo';
  const setupComplete = hasUsers && !(await c.env.DB.prepare(
    "SELECT id FROM users WHERE role = 'admin' AND must_change_password = 1 LIMIT 1"
  ).first());

  return c.json({
    has_users: hasUsers,
    setup_complete: setupComplete,
    allow_registration: isDemo ? false : registrationEnabled,
    password_login: true,
    password_registration: isDemo ? false : registrationEnabled,
    oidc_login: false,
    oidc_registration: false,
    oidc_configured: false,
    oidc_only_mode: false,
    demo_mode: isDemo,
    require_mfa: false,
    version: '0.0.0',
    is_prerelease: false,
    has_maps_key: false,
    timezone: 'UTC',
    allowed_file_types: 'jpg,jpeg,png,gif,webp,heic,pdf,doc,docx,xls,xlsx,txt,csv',
    notification_channel: 'none',
    notification_channels: [],
    available_channels: { email: false, webhook: false, inapp: true },
    trip_reminders_enabled: true,
  });
});

app.get('/me', requireAuth, async (c) => {
  const auth = c.get('user')!;
  const user = await c.env.DB.prepare(
    `SELECT id, username, email, role, avatar, mfa_enabled, last_login, created_at
     FROM users WHERE id = ? LIMIT 1`,
  )
    .bind(auth.sub)
    .first();
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(user);
});

export default app;
