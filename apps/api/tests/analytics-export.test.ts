import request from 'supertest';
import { app } from '../src/app';
import { signAccessToken } from '../src/lib/jwt';
import { prisma } from '../src/lib/prisma';
import { analyticsQueue } from '../src/lib/bullmq';

/**
 * Batch 6: GET /api/v1/hr/analytics/export?format=pdf must return the report the
 * Analytics Agent ACTUALLY generated (latest report_generated agentLog for the
 * org) — never a self-referencing fake URL. When no report exists it enqueues a
 * real generation job and reports an honest 202 instead of fabricating a URL.
 */
describe('GET /api/v1/hr/analytics/export (PDF branch)', () => {
  const hrToken = signAccessToken({
    userId: 'user-hr-1',
    email: 'hr@org.com',
    role: 'hr',
    orgId: 'org-uuid',
  });

  const mockAgentLogFindFirst = prisma.agentLog.findFirst as jest.Mock;
  const mockAnalyticsQueueAdd = analyticsQueue.add as jest.Mock;

  it('returns the latest real report URL when a report_generated log exists', async () => {
    mockAgentLogFindFirst.mockResolvedValue({
      id: 'log-1',
      org_id: 'org-uuid',
      action: 'report_generated',
      output: { report_url: '/uploads/analytics/analytics_abc123.pdf' },
      created_at: new Date('2026-08-01T00:00:00Z'),
    });

    const res = await request(app)
      .get('/api/v1/hr/analytics/export?format=pdf')
      .set('Cookie', [`access_token=${hrToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reportUrl).toBe('/uploads/analytics/analytics_abc123.pdf');
    expect(res.body.data.format).toBe('pdf');
    expect(res.body.data.generatedAt).toBe(new Date('2026-08-01T00:00:00Z').toISOString());
    expect(mockAnalyticsQueueAdd).not.toHaveBeenCalled();
  });

  it('enqueues a real PDF generation job and returns 202 when no report exists', async () => {
    mockAgentLogFindFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/v1/hr/analytics/export?format=pdf')
      .set('Cookie', [`access_token=${hrToken}`]);

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('generating');
    expect(mockAnalyticsQueueAdd).toHaveBeenCalledWith(
      'generate_analytics_report',
      expect.objectContaining({ orgId: 'org-uuid', type: 'manual_export', format: 'pdf' }),
      expect.any(Object)
    );
  });

  it('does not fabricate a URL when the latest log has no report_url (falls back to 202)', async () => {
    mockAgentLogFindFirst.mockResolvedValue({
      id: 'log-1',
      org_id: 'org-uuid',
      action: 'report_generated',
      output: { report_url: '' },
      created_at: new Date('2026-08-01T00:00:00Z'),
    });

    const res = await request(app)
      .get('/api/v1/hr/analytics/export?format=pdf')
      .set('Cookie', [`access_token=${hrToken}`]);

    expect(res.status).toBe(202);
    expect(res.body.data.status).toBe('generating');
    expect(res.body.data).not.toHaveProperty('reportUrl');
    expect(mockAnalyticsQueueAdd).toHaveBeenCalled();
  });
});
