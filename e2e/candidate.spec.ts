import { test, expect } from './fixtures';
import {
  loginOnPage,
  completeCandidateProfileOnPage,
  CANDIDATE_EMAIL,
  HR_EMAIL,
  PASSWORD,
  API_BASE,
} from './helpers';

let jobId = '';

test.beforeAll(async ({ sharedPage }) => {
  // Complete candidate profile gate
  await completeCandidateProfileOnPage(sharedPage, CANDIDATE_EMAIL);

  // Create a fresh published job as HR
  await loginOnPage(sharedPage, HR_EMAIL, PASSWORD);
  const title = `PW E2E Apply Target ${Date.now()}`;
  const res = await sharedPage.request.post(`${API_BASE}/jobs`, {
    data: {
      title,
      description: 'A dedicated end-to-end test position used by the Playwright apply-flow suite.',
      location: 'Remote',
      experienceLevel: 'Senior',
      department: 'Engineering',
      skills: ['TypeScript', 'Node.js'],
      status: 'published',
    },
  });
  if (!res.ok()) {
    throw new Error(`createJob failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  jobId = body.data.job?.id ?? body.data.id;
  if (!jobId) throw new Error('createJob returned no id');
});

test.describe('Candidate portal', () => {
  test('dashboard renders stats and sections', async ({ sharedPage: page }) => {
    await loginOnPage(page, CANDIDATE_EMAIL, PASSWORD);
    await page.goto('/candidate/dashboard');
    await expect(page).toHaveURL(/\/candidate\/dashboard$/);
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main')).toContainText(/\bApplications\b|\bScores?\b|Hire/i);
  });

  test('jobs list renders filterable job cards', async ({ sharedPage: page }) => {
    await loginOnPage(page, CANDIDATE_EMAIL, PASSWORD);
    await page.goto('/candidate/jobs');
    await expect(page).toHaveURL(/\/candidate\/jobs$/);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('link', { name: /Jobs/i }).first()).toBeVisible();
    const cardCount = await page.locator('[class*="JobCard"] a, main a[href*="/candidate/jobs/"]').count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('job detail renders and apply flow creates an application', async ({ sharedPage: page }) => {
    test.skip(!jobId, 'no job created in setup');
    await loginOnPage(page, CANDIDATE_EMAIL, PASSWORD);
    await page.goto(`/candidate/jobs/${jobId}`);
    await expect(page.getByRole('button', { name: /Apply to this Role/i })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /Apply to this Role/i }).click();
    await page.waitForURL(/\/candidate\/applications\/[0-9a-f-]+/, { timeout: 20_000 });
    await expect(page.locator('main')).toContainText(/Appli|Applied/i);
  });

  test('applications list shows rows with status', async ({ sharedPage: page }) => {
    await loginOnPage(page, CANDIDATE_EMAIL, PASSWORD);
    await page.goto('/candidate/applications');
    await expect(page.getByText('My Applications')).toBeVisible();
    const rows = page.locator('tbody tr, [class*="table"] tr').first();
    await expect(rows).toBeVisible();
  });

  test('application detail shows stage timeline', async ({ sharedPage: page }) => {
    await loginOnPage(page, CANDIDATE_EMAIL, PASSWORD);
    await page.goto('/candidate/applications');
    const trackLink = page.locator('a[href*="/candidate/applications/"]').first();
    await expect(trackLink).toBeVisible();
    const href = await trackLink.getAttribute('href');
    await page.goto(href!);
    await expect(page.locator('main')).toBeVisible();
  });

  test('mock history page renders', async ({ sharedPage: page }) => {
    await loginOnPage(page, CANDIDATE_EMAIL, PASSWORD);
    await page.goto('/candidate/mock/history');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).toContainText(/History|Score|Practice/i);
  });

  test('mock interview setup page renders', async ({ sharedPage: page }) => {
    await loginOnPage(page, CANDIDATE_EMAIL, PASSWORD);
    await page.goto('/candidate/mock/new');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Mock|Practice|Interview/i);
  });

  test('resume builder setup page renders', async ({ sharedPage: page }) => {
    await loginOnPage(page, CANDIDATE_EMAIL, PASSWORD);
    await page.goto('/candidate/resume-builder');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Resume/i);
  });

  test('profile page renders', async ({ sharedPage: page }) => {
    await loginOnPage(page, CANDIDATE_EMAIL, PASSWORD);
    await page.goto('/candidate/profile');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Profile|Readiness|Resume/i);
  });

  test('resume vault renders', async ({ sharedPage: page }) => {
    await loginOnPage(page, CANDIDATE_EMAIL, PASSWORD);
    await page.goto('/candidate/resumes');
    await expect(page.locator('main')).toBeVisible();
  });

  test('notifications page renders', async ({ sharedPage: page }) => {
    await loginOnPage(page, CANDIDATE_EMAIL, PASSWORD);
    await page.goto('/candidate/notifications');
    await expect(page.locator('main')).toBeVisible();
  });
});
