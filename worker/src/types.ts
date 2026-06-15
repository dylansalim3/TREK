export interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  TRIP_ROOM: DurableObjectNamespace;
  // Secrets (set via `wrangler secret put`)
  JWT_SECRET?: string;
  APP_URL?: string;
  ALLOWED_ORIGINS?: string;
  JWT_ISSUER?: string;
  APP_NAME?: string;
}

export interface JwtPayload {
  sub: number;
  email: string;
  username: string;
  role: string;
  pv: number; // password_version
}

export interface AppVariables {
  user?: JwtPayload;
}
