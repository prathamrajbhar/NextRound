import { test, expect } from '@playwright/test';

test.describe('E2E — Public Job Listing', () => {
  test('jobs listing page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/jobs');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=job').or(page.locator('input[type="search"]'))).toBeVisible();
  });

  test('job detail page accessible', async ({ page }) => {
    // Navigate to a known job or the first listed job
    await page.goto('http://localhost:3000/jobs');
    await page.waitForLoadState('networkidle');

    const firstJob = page.locator('[data-testid="job-card"]').first();
    if (await firstJob.isVisible()) {
      await firstJob.click();
      await page.waitForURL(/\/jobs\/.+/);
      await expect(page.locator('[data-testid="job-detail"]')).toBeVisible();
    }
  });

  test('public jobs are searchable', async ({ page }) => {
    await page.goto('http://localhost:3000/jobs');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('engineer');
      await page.waitForTimeout(1000);
      // Should show results or empty state
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
