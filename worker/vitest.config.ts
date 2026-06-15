import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    cloudflareTest({
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
      },
      wrangler: {
        configPath: resolve(__dirname, 'wrangler.toml'),
      },
    }),
  ],
  test: {
    globals: true,
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
