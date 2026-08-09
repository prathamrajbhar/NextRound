import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/lib/jwt';

/**
 * Batch 7b scheduling-honesty contract:
 *  - GET /applications/:id exposes the Scheduler Agent's real slot proposals
 *    (persisted as a scheduler_agent AgentLog) as `scheduledSlots`; when none
 *    exist the field is omitted so the client renders an honest empty state
 *    instead of a fabricated 'Tomorrow at 10:00 AM' fallback.
 *  - POST /applications/:id/schedule persists the chosen real slot on the
 *    Interview record (no fabricated confirmation).
 */
describe('Candidate schedule payload honesty', () => {
  const candidateToken = signAccessToken({
    userId: 'user-cand-1',
    email: 'candidate@test.com',
    role: 'candidate',
  });

  const mockAppFindUnique = prisma.application.findUnique as jest.Mock;
  const mockAgentLogFindFirst = prisma.agentLog.findFirst as jest.Mock;

  function baseApplication(overrides: Record<string, unknown> = {}) {
    return {
      id: 'app-1',
      candidate_id: 'cand-1',
      job_id: 'job-1',
      status: 'interview_scheduled',
      applied_at: new Date(),
      candidate: {
        id: 'cand-1',
        user_id: 'user-cand-1',
        user: { id: 'user-cand-1', email: 'candidate@test.com' },
      },
      job: {
        id: 'job-1',
        title: 'Backend Engineer',
        org_id: 'org-1',
        organization: { id: 'org-1', name: 'Acme Corp', logo_url: null },
      },
      interview: { id: 'int-1', status: 'scheduled', scheduled_at: null },
      evaluations: [],
      ...overrides,
    };
  }

  describe('GET /api/v1/applications/:id', () => {
    it('returns the scheduler agent slots when they exist', async () => {
      mockAppFindUnique.mockResolvedValue(baseApplication());
      mockAgentLogFindFirst.mockResolvedValue({
        id: 'log-1',
        output: {
          slots: ['2026-08-11T10:00:00.000Z', '2026-08-11T14:00:00.000Z'],
          formatted_email: 'invite',
        },
      });

      const res = await request(app)
        .get('/api/v1/applications/app-1')
        .set('Cookie', [`access_token=${candidateToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scheduledSlots).toEqual([
        '2026-08-11T10:00:00.000Z',
        '2026-08-11T14:00:00.000Z',
      ]);
      expect(mockAgentLogFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agent_name: 'scheduler_agent',
            action: 'slots_generated',
            input: { path: ['interviewId'], equals: 'int-1' },
          }),
        })
      );
    });

    it('omits scheduledSlots when no scheduler agent log exists (honest empty)', async () => {
      mockAppFindUnique.mockResolvedValue(baseApplication());
      mockAgentLogFindFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/applications/app-1')
        .set('Cookie', [`access_token=${candidateToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scheduledSlots).toBeUndefined();
    });

    it('filters out non-string slot entries from the log output', async () => {
      mockAppFindUnique.mockResolvedValue(baseApplication());
      mockAgentLogFindFirst.mockResolvedValue({
        id: 'log-1',
        output: { slots: ['2026-08-11T10:00:00.000Z', 42, null] },
      });

      const res = await request(app)
        .get('/api/v1/applications/app-1')
        .set('Cookie', [`access_token=${candidateToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.scheduledSlots).toEqual(['2026-08-11T10:00:00.000Z']);
    });

    it('requires candidate ownership (403 for another candidate)', async () => {
      const otherToken = signAccessToken({
        userId: 'user-other',
        email: 'other@test.com',
        role: 'candidate',
      });
      mockAppFindUnique.mockResolvedValue(baseApplication());

      const res = await request(app)
        .get('/api/v1/applications/app-1')
        .set('Cookie', [`access_token=${otherToken}`]);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/applications/:id/schedule', () => {
    it('persists the chosen real slot on the interview record', async () => {
      mockAppFindUnique.mockResolvedValue(baseApplication());
      const mockAppUpdate = prisma.application.update as jest.Mock;
      const mockInterviewUpsert = prisma.interview.upsert as jest.Mock;
      mockAppUpdate.mockResolvedValue({ id: 'app-1', status: 'interview_scheduled' });
      mockInterviewUpsert.mockResolvedValue({
        id: 'int-1',
        scheduled_at: new Date('2026-08-11T10:00:00.000Z'),
        status: 'scheduled',
      });

      const res = await request(app)
        .post('/api/v1/applications/app-1/schedule')
        .set('Cookie', [`access_token=${candidateToken}`])
        .send({ scheduledAt: '2026-08-11T10:00:00.000Z' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockInterviewUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            scheduled_at: new Date('2026-08-11T10:00:00.000Z'),
            status: 'scheduled',
          }),
          update: expect.objectContaining({
            scheduled_at: new Date('2026-08-11T10:00:00.000Z'),
          }),
        })
      );
    });
  });
});
