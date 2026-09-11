import { test as base, chromium } from '@playwright/test';
import type { Browser, BrowserContext, Page } from '@playwright/test';

let cachedBrowser: Browser | null = null;
let sharedCtx: BrowserContext | null = null;

/**
 * The `browser` fixture is cached at module level and reused across every test
 * AND every spec file running in this worker (workers:1), so the Chrome window
 * stays open for the whole run instead of being torn down between tests.
 */
type Fixtures = {
  browser: Browser;
  sharedContext: BrowserContext;
  sharedPage: Page;
};

export const test = base.extend<Fixtures>({
  browser: async ({}, use) => {
    if (!cachedBrowser) {
      cachedBrowser = await chromium.launch({
        channel: 'chrome',
        headless: process.env.PW_HEADLESS === '1',
        args: [
          '--use-fake-ui-for-media-stream',
          '--use-fake-device-for-media-stream',
          '--autoplay-policy=no-user-gesture-required',
        ],
      });
    }
    await use(cachedBrowser);
  },

  sharedContext: async ({ browser }, use) => {
    if (!sharedCtx) {
      sharedCtx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
    }
    await use(sharedCtx);
  },

  sharedPage: async ({ sharedContext }, use) => {
    const page = await sharedContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';