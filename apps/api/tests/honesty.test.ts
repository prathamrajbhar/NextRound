import request from 'supertest';
import { app } from '../src/app';
import { signAccessToken } from '../src/lib/jwt';

/**
 * Batch 1 honesty contract: endpoints that depend on unimplemented ML/network
 * integrations (audio-prosody sentiment, LinkedIn scraping) must fail honestly
 * with a non-2xx envelope instead of returning fabricated data.
 */
describe('Honesty Endpoints (no fabricated data)', () => {
  const hrToken = signAccessToken({
    userId: 'user-hr-1',
    email: 'hr@org.com',
    role: 'hr',
    orgId: 'org-uuid',
  });
  const candidateToken = signAccessToken({
    userId: 'user-cand-1',
    email: 'candidate@test.com',
    role: 'candidate',
  });

  describe('GET /api/v1/hr/sentiment/:interviewId', () => {
    it('returns 501 with an honest unavailable envelope (no fabricated metrics)', async () => {
      const res = await request(app)
        .get('/api/v1/hr/sentiment/int-123')
        .set('Cookie', [`access_token=${hrToken}`]);

      expect(res.status).toBe(501);
      expect(res.body.success).toBe(false);
      expect(res.body.data).toBeNull();
      expect(res.body.error).toContain('unavailable');
    });

    it('requires HR role (candidate receives 403)', async () => {
      const res = await request(app)
        .get('/api/v1/hr/sentiment/int-123')
        .set('Cookie', [`access_token=${candidateToken}`]);

      expect(res.status).toBe(403);
    });

    it('requires authentication (no token receives 401)', async () => {
      const res = await request(app).get('/api/v1/hr/sentiment/int-123');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/candidate/sync-social', () => {
    it('returns 422 with an honest failure when the LinkedIn scraper is unreachable', async () => {
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new Error('scraper network unreachable'));
      try {
        const res = await request(app)
          .post('/api/v1/candidate/sync-social')
          .send({ linkedinUrl: 'https://www.linkedin.com/in/janedoe' });

        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('scraper network unreachable');
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it('returns 504 when the LinkedIn scraper times out (upstream timeout is an upstream error)', async () => {
      // The service's real fetch path uses an AbortController + timeout. In the
      // unit test we simulate the upstream abort by rejecting fetch with an
      // AbortError; the route must map the resulting "timed out" reason to 504,
      // not the generic 422 client-error.
      const abortError = Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' });
      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);
      try {
        const res = await request(app)
          .post('/api/v1/candidate/sync-social')
          .send({ linkedinUrl: 'https://www.linkedin.com/in/janedoe' });

        expect(res.status).toBe(504);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('timed out');
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it('returns the synced LinkedIn data when the scraper succeeds', async () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            profile: {
              name: 'Jane Doe',
              headline: 'Senior Software Engineer',
              skills: ['TypeScript', 'Python'],
              experiences: [],
              education: [],
            },
            posts: [],
          }),
      } as unknown as Response);
      try {
        const res = await request(app)
          .post('/api/v1/candidate/sync-social')
          .send({ linkedinUrl: 'https://www.linkedin.com/in/janedoe' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.linkedin.status).toBe('synced');
        expect(res.body.data.linkedin.synced).toBe(true);
        expect(res.body.data.extractedSkills).toEqual(['TypeScript', 'Python']);
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it('returns 400 when neither githubUrl nor linkedinUrl is provided', async () => {
      const res = await request(app).post('/api/v1/candidate/sync-social').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
