import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['apps/*/src/**/*.{test,spec}.{ts,tsx}', 'packages/*/src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/playwright/**'],
    setupFiles: [],
    testTimeout: 10000,
    env: {
      PROFILE_SCRAPER_TIMEOUT_MS: '15000',
      JWT_SECRET: 'test-jwt-secret-at-least-32-chars-long-123456',
      JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-at-least-32-chars-long-123456',
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@nextround/database': path.resolve(__dirname, 'packages/database/src/index.ts'),
      '@nextround/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
    },
  },
});
