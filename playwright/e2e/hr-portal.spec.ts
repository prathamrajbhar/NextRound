import { test, expect } from '@playwright/test';

test.describe('E2E — HR Portal', () => {
  const HR_EMAIL = `e2e-hr-${Date.now()}@acme.com`;
  const HR_PASSWORD = 'HrTestPass123!';
  const ORG_NAME = `E2E Test Corp ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // Register HR
    await page.goto('http://localhost:3000/auth/signup');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="email"]', HR_EMAIL);
    await page.fill('input[name="password"]', HR_PASSWORD);
    await page.fill('input[name="role"]', 'hr');
    await page.fill('input[name="orgName"]', ORG_NAME);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/hr\/dashboard/);
    await expect(page.locator(`text=${ORG_NAME}`)).toBeVisible();
  });

  test('HR dashboard loads with org context', async ({ page }) => {
    await expect(page.locator('[data-testid="hr-dashboard"]')).toBeVisible();
    await expect(page.locator(`text=${ORG_NAME}`)).toBeVisible();
  });

  test('HR can create a job', async ({ page }) => {
    await page.goto('http://localhost:3000/hr/jobs/new');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="title"]', `E2E Test Job — ${Date.now()}`);
    await page.fill('textarea[name="description"]', 'Test job description for E2E validation.');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/hr\/jobs/);
    await expect(page.locator('text=E2E Test Job')).toBeVisible();
  });

  test('HR can view pipeline', async ({ page }) => {
    await page.goto('http://localhost:3000/hr/jobs');
    await page.waitForLoadState('networkidle');

    const firstJob = page.locator('table tbody tr').first();
    if (await firstJob.isVisible()) {
      await firstJob.click({ target: 'link' });
      await page.waitForURL(/\/hr\/jobs\/.+/);

      const jobId = page.url().match(/\/jobs\/([^/]+)/)?.[1];
      if (jobId) {
        await page.goto(`http://localhost:3000/hr/jobs/${jobId}/pipeline`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-testid="pipeline"]')).toBeVisible();
      }
    }
  });

  test('HR can view candidate evaluation', async ({ page }) => {
    await page.goto('http://localhost:3000/hr/candidates');
    await page.waitForLoadState('networkidle');

    const firstCandidate = page.locator('[data-testid="candidate-row"]').first();
    if (await firstCandidate.isVisible()) {
      await firstCandidate.click({ target: 'link' });
      await page.waitForURL(/\/hr\/candidates\/.+/);
      await expect(page.locator('[data-testid="evaluation-section"]')).toBeVisible();
    }
  });
});
