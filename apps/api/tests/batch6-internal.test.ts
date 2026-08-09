import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

/**
 * Batch 6 internal-webhook honesty contract:
 *  - POST /offers derives terms from the real Job record (never fabricated
 *    fallbacks), refusing with 422 when the job has no salary and 404 when the
 *    application is missing.
 *  - GET /analytics/raw passes the corrected Prisma include block so the Python
 *    Analytics Agent receives `interview` and `offer` relations (the offer
 *    created_at is the terminal timestamp used to compute REAL time-to-hire).
 */
describe('POST /api/v1/internal/offers (real job-derived terms)', () => {
  const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'test-internal-service-secret';
  const mockApplicationFindUnique = prisma.application.findUnique as jest.Mock;
  const mockOfferUpsert = prisma.offer.upsert as jest.Mock;

  it('refuses to create an offer when the job has no salary configured (422)', async () => {
    mockApplicationFindUnique.mockResolvedValue({
      id: 'app-1',
      job: { id: 'job-1', title: 'Backend Engineer', salary: null },
    });

    const res = await request(app)
      .post('/api/v1/internal/offers')
      .set('x-internal-service-secret', INTERNAL_SECRET)
      .send({ application_id: 'app-1' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('no salary configured');
    expect(res.body.error).toContain('Backend Engineer');
  });

  it('returns 404 when the application is missing', async () => {
    mockApplicationFindUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/internal/offers')
      .set('x-internal-service-secret', INTERNAL_SECRET)
      .send({ application_id: 'app-missing' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Application not found');
  });

  it('derives the offer terms from the job when the job has a salary', async () => {
    mockApplicationFindUnique.mockResolvedValue({
      id: 'app-1',
      job: {
        id: 'job-1',
        title: 'Backend Engineer',
        salary: '$120k - $150k',
        thresholds: { equity: '0.25%' },
      },
    });
    // Non-matching magic token means the route skips the offer email.
    mockOfferUpsert.mockResolvedValue({
      id: 'offer-1',
      role_title: 'Backend Engineer',
      salary: 150000,
      equity: '0.25%',
      magic_link_token: 'stale-token',
    });

    const res = await request(app)
      .post('/api/v1/internal/offers')
      .set('x-internal-service-secret', INTERNAL_SECRET)
      .send({ application_id: 'app-1' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // role_title is the real job title, salary the top-of-band derived figure —
    // never a fabricated default.
    expect(res.body.data.role_title).toBe('Backend Engineer');
    expect(res.body.data.salary).toBe(150000);
    expect(res.body.data.equity).toBe('0.25%');
    // The derived terms (not hardcoded amounts) are what reach the DB upsert.
    expect(mockOfferUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ salary: 150000, equity: '0.25%', role_title: 'Backend Engineer' }),
      })
    );
  });
});

describe('GET /api/v1/internal/analytics/raw (include block)', () => {
  const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'test-internal-service-secret';
  const mockJobFindMany = prisma.job.findMany as jest.Mock;

  it('passes the corrected include block (interview + offer) to the jobs query', async () => {
    mockJobFindMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/v1/internal/analytics/raw?org_id=org-uuid')
      .set('x-internal-service-secret', INTERNAL_SECRET);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockJobFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { org_id: 'org-uuid' },
        include: {
          applications: {
            include: expect.objectContaining({
              evaluations: true,
              // Prisma relation is the singular `interview`, and the offer must
              // be included so the Analytics Agent can compute REAL time-to-hire.
              interview: true,
              offer: true,
            }),
          },
        },
      })
    );
  });

  it('rejects the request when org_id is missing', async () => {
    const res = await request(app)
      .get('/api/v1/internal/analytics/raw')
      .set('x-internal-service-secret', INTERNAL_SECRET);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('org_id');
  });
});
