/**
 * Unit tests for the assessment-stage pipeline helper (lib/pipeline.ts).
 * Verifies monotonic status transitions: the application stays in the
 * assessment phase until ALL enabled modalities have a stored score, then
 * advances to interview_scheduled and enqueues the Scheduler Agent.
 */
import { advanceAssessmentStage, ensureInterviewAndSchedule } from '../src/lib/pipeline';

jest.mock('@nextround/database', () => ({
  prisma: {
    application: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    interview: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../src/lib/queues/scheduling.queue', () => ({
  enqueueScheduling: jest.fn().mockResolvedValue(undefined),
}));

import { prisma } from '@nextround/database';
import { enqueueScheduling } from '../src/lib/queues/scheduling.queue';

const mockFindUnique = prisma.application.findUnique as jest.Mock;
const mockUpdate = prisma.application.update as jest.Mock;
const mockInterviewCreate = prisma.interview.create as jest.Mock;
const mockEnqueueScheduling = enqueueScheduling as jest.Mock;

function baseJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    title: 'Software Engineer',
    assessmentConfig: null,
    thresholds: null,
    ...overrides,
  };
}

function baseApp(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app-1',
    status: 'screening_completed',
    job: baseJob(),
    interview: null,
    evaluations: [],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('advanceAssessmentStage', () => {
  it('returns null while not all enabled modalities have scores', async () => {
    mockFindUnique.mockResolvedValue(
      baseApp({ evaluations: [{ aptitude_score: 80 }] }) // coding + video missing
    );
    const result = await advanceAssessmentStage('app-1');
    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockEnqueueScheduling).not.toHaveBeenCalled();
  });

  it('advances to interview_scheduled once all enabled modalities pass', async () => {
    mockFindUnique.mockResolvedValue(
      baseApp({
        job: baseJob({ assessmentConfig: { aptitude_enabled: true, coding_enabled: false, video_screening_enabled: true } }),
        evaluations: [
          {
            aptitude_score: 82,
            coding_score: null,
            bias_report: { video_score: 91 },
          },
        ],
      })
    );
    mockInterviewCreate.mockResolvedValue({ id: 'intv-1' });
    mockUpdate.mockResolvedValue({ id: 'app-1', status: 'interview_scheduled' });

    const result = await advanceAssessmentStage('app-1');

    expect(result).toBe('interview_scheduled');
    expect(mockInterviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ application_id: 'app-1' }) })
    );
    expect(mockEnqueueScheduling).toHaveBeenCalledWith(
      'app-1',
      expect.objectContaining({ interviewId: 'intv-1', action: 'generate_slots' })
    );
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'app-1' },
      data: { status: 'interview_scheduled' },
    });
  });

  it('leaves status untouched when already past the assessment phase', async () => {
    mockFindUnique.mockResolvedValue(baseApp({ status: 'hr_round' }));
    const result = await advanceAssessmentStage('app-1');
    expect(result).toBe('hr_round');
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInterviewCreate).not.toHaveBeenCalled();
  });
});

describe('ensureInterviewAndSchedule', () => {
  it('creates the Interview and enqueues the scheduler when no interview exists', async () => {
    mockFindUnique.mockResolvedValue(
      baseApp({
        candidate: { user: { email: 'cand@example.com' } },
        job: baseJob({ title: 'Backend Engineer' }),
      })
    );
    mockInterviewCreate.mockResolvedValue({ id: 'intv-9' });

    const result = await ensureInterviewAndSchedule('app-1');

    expect(result).toEqual({ interviewId: 'intv-9' });
    expect(mockInterviewCreate).toHaveBeenCalled();
    expect(mockEnqueueScheduling).toHaveBeenCalledWith(
      'app-1',
      expect.objectContaining({
        interviewId: 'intv-9',
        candidateEmail: 'cand@example.com',
        jobTitle: 'Backend Engineer',
        action: 'generate_slots',
      })
    );
  });

  it('passes the real orgId and org availability hours to the scheduler', async () => {
    mockFindUnique.mockResolvedValue(
      baseApp({
        candidate: { user: { email: 'cand@example.com' } },
        job: baseJob({
          title: 'Platform Engineer',
          org_id: 'org-1',
          organization: {
            settings: { availabilityHours: { weekday: { morning: true } } },
          },
        }),
      })
    );
    mockInterviewCreate.mockResolvedValue({ id: 'intv-10' });

    await ensureInterviewAndSchedule('app-1');

    expect(mockEnqueueScheduling).toHaveBeenCalledWith(
      'app-1',
      expect.objectContaining({
        orgId: 'org-1',
        availabilityHours: { weekday: { morning: true } },
        action: 'generate_slots',
      })
    );
  });

  it('passes no availability hours when the org has no availability config', async () => {
    mockFindUnique.mockResolvedValue(
      baseApp({
        candidate: { user: { email: 'cand@example.com' } },
        job: baseJob({ title: 'Platform Engineer', org_id: 'org-1' }),
      })
    );
    mockInterviewCreate.mockResolvedValue({ id: 'intv-11' });

    await ensureInterviewAndSchedule('app-1');

    expect(mockEnqueueScheduling).toHaveBeenCalledWith(
      'app-1',
      expect.objectContaining({
        orgId: 'org-1',
        availabilityHours: undefined,
        action: 'generate_slots',
      })
    );
  });

  it('reuses the existing interview and returns its id (idempotent)', async () => {
    mockFindUnique.mockResolvedValue(baseApp({ interview: { id: 'intv-existing' } }));
    const result = await ensureInterviewAndSchedule('app-1');
    expect(result).toEqual({ interviewId: 'intv-existing' });
    expect(mockInterviewCreate).not.toHaveBeenCalled();
    expect(mockEnqueueScheduling).toHaveBeenCalledTimes(1);
  });

  it('returns null interview id when the application is missing', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await ensureInterviewAndSchedule('nope');
    expect(result).toEqual({ interviewId: null });
    expect(mockEnqueueScheduling).not.toHaveBeenCalled();
  });
});
