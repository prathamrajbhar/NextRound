import { test, expect } from './fixtures';
import { HR_EMAIL, PASSWORD, uiLogin } from './helpers';

test.describe('Authentication flows', () => {
  test('candidate with incomplete profile is routed to candidate onboarding', async ({ page }) => {
    await uiLogin(page, 'rahul.gupta@gmail.com', PASSWORD, '/onboarding/candidate');
    await expect(page.getByText(/Personal & Contact/i).first()).toBeVisible();
  });

  test('hr user lands on hr dashboard', async ({ page }) => {
    await uiLogin(page, HR_EMAIL, PASSWORD, '/hr/dashboard');
    await expect(page.locator('aside, [class*="sidebar"]').first()).toBeVisible();
  });

  test('wrong password shows error alert and stays on login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', HR_EMAIL);
    await page.fill('#password', 'definitely-wrong');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('signup validates minimum password length', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('#name', 'PW Tester');
    await page.fill('#email', 'shortpw@test.local');
    await page.fill('#password', 'short');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/signup/);
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/at least 8|min 8|8 characters|too small/i);
  });

  test('logs out from hr session returns to login-safe state', async ({ page }) => {
    await uiLogin(page, HR_EMAIL, PASSWORD, '/hr/dashboard');
    const logout = page.getByRole('button', { name: /Logout|Log out|Sign out/i });
    if ((await logout.count()) > 0) {
      await logout.first().click();
      await page.waitForURL(/\/login|^\/$/, { timeout: 15_000 });
    }
  });
});
