import { test, expect } from '@playwright/test';

test.describe('E2E — Auth Smoke Tests', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('header')).toBeVisible();
  });

  test('login page accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('signup page accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signup');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="role"]')).toBeVisible();
  });
});
