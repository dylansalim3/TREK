import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const migrationsDir = resolve(__dirname, 'migrations');
let migrationFiles: string[] = [];
try {
  migrationFiles = readdirSync(migrationsDir)
    .filter((f: string) => f.endsWith('.sql'))
    .sort()
    .map((f: string) => resolve(migrationsDir, f));
} catch {
  migrationFiles = [];
}

export default defineWorkersConfig({
  test: {
    globals: true,
    poolOptions: {
      workers: {
        singleWorker: true,
        miniflare: {
          bindings: {
            APP_NAME: 'TREK',
            JWT_ISSUER: 'trek-api',
            JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
            ALLOWED_ORIGINS: '*',
            APP_URL: 'http://localhost',
          },
          d1Databases: {
            DB: '__test_db__',
          },
          r2Buckets: {
            UPLOADS: '__test_uploads__',
          },
          migrations: migrationFiles,
        },
        wranglerConfigPath: resolve(__dirname, 'wrangler.toml'),
      },
    },
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
