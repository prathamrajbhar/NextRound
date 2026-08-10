import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@nextround/shared': path.resolve(import.meta.dirname, '../../packages/shared/src'),
      '@nextround/database': path.resolve(import.meta.dirname, '../../packages/database/src'),
    },
  },
});
