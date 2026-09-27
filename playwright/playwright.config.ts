/**
 * Playwright Configuration
 *
 * Run with: npx playwright test
 * Debug:    npx playwright test --debug
 * UI Mode:  npx playwright test --ui
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  retries: 1,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: [
    {
      command: 'cd ../apps/api && npx tsx src/index.ts',
      url: 'http://localhost:3001',
      reuse: false,
      timeout: 15000,
      ignoreHTTPSErrors: true,
    },
  ],
});
