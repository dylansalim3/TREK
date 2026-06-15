/// <reference types="@cloudflare/vitest-pool-workers" />

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
    UPLOADS: R2Bucket;
    TRIP_ROOM: DurableObjectNamespace;
  }
  export const env: ProvidedEnv;
  export const SELF: Fetcher;
}
