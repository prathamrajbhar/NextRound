import { test, expect } from './fixtures';
import { loginOnPage, HR_EMAIL, API_BASE } from './helpers';

let applicationId = '';

test.beforeAll(async ({ sharedPage }) => {
  await loginOnPage(sharedPage, HR_EMAIL);
  const res = await sharedPage.request.get(`${API_BASE}/applications`);
  if (!res.ok()) throw new Error(`list org applications failed: ${res.status()}`);
  const body = await res.json();
  const apps = body.data?.applications ?? body.data ?? [];
  applicationId = apps[0]?.id ?? '';
});

test.describe('HR portal', () => {
  test('dashboard renders KPIs', async ({ sharedPage: page }) => {
    await loginOnPage(page, HR_EMAIL);
    await page.goto('/hr/dashboard');
    await expect(page).toHaveURL(/\/hr\/dashboard$/);
    await expect(page.getByRole('link', { name: /Overview/i })).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('jobs list renders table with tab filters', async ({ sharedPage: page }) => {
    await loginOnPage(page, HR_EMAIL);
    await page.goto('/hr/jobs');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('button', { name: /Post a Job|Create|New/i })).toBeVisible();
    await expect(page.locator('body')).toContainText(/Active|All|Draft/i);
  });

  test('create-job form renders with pipeline config', async ({ sharedPage: page }) => {
    await loginOnPage(page, HR_EMAIL);
    await page.goto('/hr/jobs/new');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Job|Position|Role/i);
  });

  test('talent pool renders', async ({ sharedPage: page }) => {
    await loginOnPage(page, HR_EMAIL);
    await page.goto('/hr/talent-pool');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Candidate|Match|Talent/i);
  });

  test('analytics renders', async ({ sharedPage: page }) => {
    await loginOnPage(page, HR_EMAIL);
    await page.goto('/hr/analytics');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Analytics|Applicant|Funnel/i);
  });

  test('sentiment analysis renders', async ({ sharedPage: page }) => {
    await loginOnPage(page, HR_EMAIL);
    await page.goto('/hr/sentiment-analysis');
    await expect(page.locator('main')).toBeVisible();
  });

  test('notifications renders', async ({ sharedPage: page }) => {
    await loginOnPage(page, HR_EMAIL);
    await page.goto('/hr/notifications');
    await expect(page.locator('main')).toBeVisible();
  });

  test('candidate dossier renders', async ({ sharedPage: page }) => {
    test.skip(!applicationId, 'no org applications in setup');
    await loginOnPage(page, HR_EMAIL);
    await page.goto(`/hr/candidates/${applicationId}`);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Candidate|Dossier/i);
  });

  test('candidate scoring report renders', async ({ sharedPage: page }) => {
    test.skip(!applicationId, 'no org applications in setup');
    await loginOnPage(page, HR_EMAIL);
    await page.goto(`/hr/candidates/${applicationId}/scoring`);
    await expect(page.locator('main')).toBeVisible();
  });

  test('AI interview replay renders transcript', async ({ sharedPage: page }) => {
    test.skip(!applicationId, 'no org applications in setup');
    await loginOnPage(page, HR_EMAIL);
    await page.goto(`/hr/candidates/${applicationId}/interview`);
    await expect(page.locator('main')).toBeVisible();
  });

  test('profile page renders', async ({ sharedPage: page }) => {
    await loginOnPage(page, HR_EMAIL);
    await page.goto('/hr/profile');
    await expect(page.locator('main')).toBeVisible();
  });

  test('settings page renders', async ({ sharedPage: page }) => {
    await loginOnPage(page, HR_EMAIL);
    await page.goto('/hr/settings');
    await expect(page.locator('main')).toBeVisible();
  });
});
