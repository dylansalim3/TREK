import { SignJWT } from 'jose';

const TEST_SECRET = new TextEncoder().encode('test-jwt-secret-for-trek-testing-only');

export async function generateToken(
  userId: number,
  extraClaims: Record<string, unknown> = {}
): Promise<string> {
  return await new SignJWT({ sub: String(userId), ...extraClaims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('trek-api')
    .setExpirationTime('1h')
    .sign(TEST_SECRET);
}

export async function authHeader(userId: number): Promise<Record<string, string>> {
  const token = await generateToken(userId);
  return { Authorization: `Bearer ${token}` };
}
