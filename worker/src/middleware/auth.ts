import type { Context, Next } from 'hono';
import { jwtVerify, SignJWT } from 'jose';
import type { AppVariables, Env, JwtPayload } from '../types';

function getSecret(env: Env): Uint8Array {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Set it via `wrangler secret put JWT_SECRET`.');
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(env: Env, payload: JwtPayload, expiresIn = '7d'): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER ?? 'trek-api')
    .setExpirationTime(expiresIn)
    .sign(getSecret(env));
}

export async function verifyToken(env: Env, token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecret(env), {
    issuer: env.JWT_ISSUER ?? 'trek-api',
  });
  return payload as unknown as JwtPayload;
}

function extractToken(c: Context<{ Bindings: Env; Variables: AppVariables }>): string | null {
  const auth = c.req.header('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice('Bearer '.length);
  const cookie = c.req.header('Cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)trek_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function requireAuth(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next,
): Promise<Response | void> {
  const token = extractToken(c);
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const payload = await verifyToken(c.env, token);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}

export async function adminOnly(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next,
): Promise<Response | void> {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
}
