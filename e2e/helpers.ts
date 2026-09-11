import { Page, BrowserContext, APIRequestContext } from '@playwright/test';

export const WEB_BASE = process.env.PW_BASE_URL || 'http://localhost:3000';
export const API_BASE = process.env.PW_API_BASE || 'http://localhost:4000/api/v1';

export const HR_EMAIL = 'steve.hr@gmail.com';
export const CANDIDATE_EMAIL = 'pratham@gmail.com';
export const PASSWORD = '123456789';

/**
 * Login via the API and set cookies on the browser context that owns `page`.
 * After this call, `page.goto('/candidate/dashboard')` etc. will be authenticated.
 */
export async function loginOnPage(page: Page, email: string, password: string = PASSWORD): Promise<void> {
  const res = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`login failed for ${email}: ${res.status()} ${await res.text()}`);
  }
}

/**
 * Login via the API directly on a BrowserContext (used in beforeAll).
 */
export async function loginOnContext(
  ctx: BrowserContext,
  email: string,
  password: string
): Promise<void> {
  // Use a temporary page to make the API call (sets cookies on the context)
  const page = await ctx.newPage();
  try {
    await loginOnPage(page, email, password);
  } finally {
    await page.close();
  }
}

/**
 * Complete a candidate's profile gate (full_name + data_consent) on the given page's context.
 */
export async function completeCandidateProfileOnPage(
  page: Page,
  email: string
): Promise<void> {
  await loginOnPage(page, email);
  const res = await page.request.post(`${API_BASE}/candidate/profile`, {
    data: { fullName: 'Test Candidate', dataConsent: true },
  });
  if (!res.ok()) {
    throw new Error(`completeCandidateProfile failed: ${res.status()} ${await res.text()}`);
  }
}

/** Return an application id for the currently-logged-in user on this page. */
export async function fetchMyApplicationId(
  page: Page,
  status?: string
): Promise<string> {
  const res = await page.request.get(`${API_BASE}/applications/my`);
  if (!res.ok()) throw new Error(`applications/my failed: ${res.status()}`);
  const body = (await res.json()) as {
    data:
      | { id: string; status: string }[]
      | { applications: { id: string; status: string }[] };
  };
  const list = Array.isArray(body.data) ? body.data : body.data.applications;
  if (status) {
    const match = list.find((a) => a.status === status);
    if (match) return match.id;
  }
  return list[0]?.id ?? '';
}

/** Drive the real UI login form at /login. */
export async function uiLogin(
  page: Page,
  email: string,
  password: string,
  expectedUrl: string
): Promise<void> {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(expectedUrl, { timeout: 20_000 });
}
