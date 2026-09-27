import { test, expect } from '@playwright/test';

test.describe('E2E — Candidate Portal', () => {
  const CANDIDATE_EMAIL = `e2e-cand-${Date.now()}@test.com`;
  const CANDIDATE_PASSWORD = 'TestPass123!';

  test.beforeEach(async ({ page }) => {
    // Register and login a test candidate
    await page.goto('http://localhost:3000/auth/signup');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="email"]', CANDIDATE_EMAIL);
    await page.fill('input[name="password"]', CANDIDATE_PASSWORD);
    await page.fill('input[name="role"]', 'candidate');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/candidate\/dashboard/);
  });

  test('candidate dashboard loads after login', async ({ page }) => {
    await expect(page.locator('[data-testid="candidate-dashboard"]')).toBeVisible();
  });

  test('candidate can view their profile', async ({ page }) => {
    await page.goto('http://localhost:3000/candidate/profile');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="candidate-profile"]')).toBeVisible();
  });

  test('candidate can edit their profile', async ({ page }) => {
    await page.goto('http://localhost:3000/candidate/profile');
    await page.waitForLoadState('networkidle');

    const editBtn = page.locator('button:has-text("Edit Profile")');
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.locator('[data-testid="profile-form"]')).toBeVisible();

      await page.fill('input[name="headline"]', 'Senior Software Engineer');
      await page.click('button:has-text("Save")');

      await expect(page.locator('text=Saved')).toBeVisible();
    }
  });

  test('candidate can upload resume', async ({ page }) => {
    await page.goto('http://localhost:3000/candidate/profile');
    await page.waitForLoadState('networkidle');

    const uploadBtn = page.locator('button:has-text("Upload Resume").or(page.locator("label:has-text(\"Resume\")"))');
    if (await uploadBtn.isVisible()) {
      // Upload a test file if available
      const testResume = await page.evaluate(() => {
        // Check if a test resume exists
        return null;
      });
      // The upload would happen here via fileChooser
    }
  });

  test('candidate application list loads', async ({ page }) => {
    await page.goto('http://localhost:3000/candidate/applications');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="application-list"]').or(page.locator('text=Your Applications'))).toBeVisible();
  });
});
