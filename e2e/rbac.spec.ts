import { test, expect } from '@playwright/test';
import { API_BASE, PASSWORD } from './helpers';

const HR = 'steve.hr@gmail.com';
const OTHER_HR = 'anita.hr@gmail.com';
const CANDIDATE = 'pratham@gmail.com';
const OTHER_CANDIDATE = 'priya.sharma@gmail.com';

let otherOrgJobId = '';
let otherCandidateAppId = '';

async function login(request: import('@playwright/test').APIRequestContext, email: string) {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password: PASSWORD },
  });
  if (!res.ok()) throw new Error(`login failed for ${email}: ${res.status()}`);
}

test.beforeAll(async ({ request }) => {
  // A job owned by a *different* org (Google Cloud India), to test HR org isolation.
  await login(request, OTHER_HR);
  const jobRes = await request.get(`${API_BASE}/jobs/org`);
  expect(jobRes.status()).toBe(200);
  const jobBody = await jobRes.json();
  otherOrgJobId = (jobBody.data?.jobs ?? jobBody.data ?? [])[0]?.id ?? '';

  // An application owned by a *different* candidate, to test candidate isolation.
  await login(request, OTHER_CANDIDATE);
  const appRes = await request.get(`${API_BASE}/applications/my`);
  expect(appRes.status()).toBe(200);
  const appBody = await appRes.json();
  otherCandidateAppId = (appBody.data?.applications ?? appBody.data ?? [])[0]?.id ?? '';
});

test.describe('RBAC — server-side authorization (direct API)', () => {
  test('unauthenticated request to HR endpoint returns 401', async ({ request }) => {
    const res = await request.get(`${API_BASE}/hr/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('candidate token is refused on HR-only endpoints (403)', async ({ request }) => {
    await login(request, CANDIDATE);
    for (const path of ['/hr/dashboard', '/hr/analytics', '/jobs/org', '/hr/talent-pool']) {
      const res = await request.get(`${API_BASE}${path}`);
      expect(res.status(), `${path} should be 403 for candidate`).toBe(403);
    }
  });

  test('candidate token is refused on HR-only mutations (403)', async ({ request }) => {
    await login(request, CANDIDATE);
    const res = await request.post(`${API_BASE}/jobs`, {
      data: { title: 'Sneaky Job', description: 'must not be created by a candidate' },
    });
    expect(res.status()).toBe(403);
  });

  test('hr token is refused on candidate-only endpoint (403)', async ({ request }) => {
    await login(request, HR);
    const res = await request.get(`${API_BASE}/candidate/settings`);
    expect(res.status()).toBe(403);
  });

  test('candidate cannot read another candidate application (403)', async ({ request }) => {
    test.skip(!otherCandidateAppId, 'no cross-candidate application found');
    await login(request, CANDIDATE);
    const res = await request.get(`${API_BASE}/applications/${otherCandidateAppId}`);
    expect(res.status()).toBe(403);
  });

  test('hr cannot read another org job (403 org isolation)', async ({ request }) => {
    test.skip(!otherOrgJobId, 'no other-org job found');
    await login(request, HR);
    const res = await request.get(`${API_BASE}/jobs/${otherOrgJobId}`);
    expect(res.status()).toBe(403);
  });

  test('candidate can access own application data (200)', async ({ request }) => {
    await login(request, CANDIDATE);
    const res = await request.get(`${API_BASE}/applications/my`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const data = Array.isArray(body.data) ? body.data : body.data?.applications;
    expect(Array.isArray(data)).toBe(true);
  });

  test('hr can access own org analytics (200)', async ({ request }) => {
    await login(request, HR);
    const res = await request.get(`${API_BASE}/hr/analytics`);
    expect(res.status()).toBe(200);
  });
});