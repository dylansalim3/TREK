import { SignJWT } from 'jose';

const TEST_SECRET = new TextEncoder().encode('test-jwt-secret-for-trek-testing-only');
const TEST_BCRYPT_ROUNDS = 4;

export interface TokenPayload {
  sub: number;
  email: string;
  username: string;
  role: string;
  pv?: number;
}

export async function generateToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload, pv: payload.pv ?? 0 })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('trek-api')
    .setExpirationTime('1h')
    .sign(TEST_SECRET);
}

export async function authHeader(
  userId: number,
  overrides: Partial<TokenPayload> = {}
): Promise<Record<string, string>> {
  const token = await generateToken({
    sub: userId,
    email: overrides.email ?? `user${userId}@test.example.com`,
    username: overrides.username ?? `testuser${userId}`,
    role: overrides.role ?? 'user',
    pv: overrides.pv ?? 0,
  });
  return { Authorization: `Bearer ${token}` };
}

export { TEST_BCRYPT_ROUNDS };
