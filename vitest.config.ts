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
  },
  resolve: {
    alias: {
      '@nextround/database': path.resolve(__dirname, 'packages/database/src/index.ts'),
      '@nextround/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
    },
  },
});
