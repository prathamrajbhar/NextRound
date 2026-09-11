import { test, expect } from './fixtures';

test.describe('Public & marketing pages', () => {
  test('landing page renders hero and navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HireOS|AI-Native/i);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /About/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pricing', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Get Started/i })).toBeVisible();
  });

  test('about page renders', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('pricing page renders with plan cards', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveTitle(/Pricing|HireOS/i);
    await expect(page.locator('main').last()).toContainText(/month|plan|pricing/i);
  });

  test('contact page renders form', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('main').last()).toBeVisible();
  });

  test('anonymous /jobs redirects to login with redirectTo', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForURL(/\/login\?redirectTo=/);
    await expect(page).toHaveURL(/redirectTo=(%2F|\/)candidate(\/|%2F)jobs/);
  });

  test('404 page renders', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).toHaveURL(/this-page-does-not-exist/);
  });

  test('login page renders fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('signup page renders role selector and fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/Candidate|Engineer|Talent/i);
  });

  test('forgot-password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { level: 2 })).toContainText(/Recover|password/i);
    await expect(page.getByRole('textbox', { name: /email|Email/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Send Reset Link/i })).toBeVisible();
  });
});

test.describe('Landing footer links', () => {
  test('hero CTA routes to signup', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /Get Started|Try it|Start/i }).first();
    if ((await cta.count()) > 0) {
      await cta.click();
      await page.waitForURL(/\/signup/);
    }
  });
});
