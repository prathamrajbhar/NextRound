import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  candidateOwnsApplication,
  applyToJob,
  withdrawApplication,
} from '../services/application/application-lifecycle.service';
import { prisma } from '../lib/prisma';
import { badRequest, notFound, forbidden } from '../lib/http-errors';
import { emailService } from '../services/email/email.service';
import { enqueueScreening } from '../lib/queues/screening.queue';
import { logger } from '../lib/logger';
import type { AppUserCtx } from '../services/application/application-scheduling.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../lib/prisma', () => ({
  prisma: {
    candidateProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    job: {
      findUnique: vi.fn(),
    },
    application: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    evaluation: {
      upsert: vi.fn(),
    },
    interview: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../lib/queues/screening.queue', () => ({
  enqueueScreening: vi.fn(),
}));

vi.mock('../services/email/email.service', () => ({
  emailService: {
    sendApplicationReceived: vi.fn(),
  },
}));

vi.mock('../lib/logger', () => ({
  logger: {
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createUserCtx = (overrides: Partial<AppUserCtx> = {}): AppUserCtx => ({
  userId: 'user-uuid-candidate',
  email: 'candidate@example.com',
  role: 'candidate',
  orgId: null,
  ...overrides,
});

const createProfile = (id = 'profile-uuid-001', userId = 'user-uuid-candidate') => ({
  id,
  user_id: userId,
  resume_url: null,
  skills: [],
  raw_resume_text: '',
  headline: 'Software Engineer',
  years_of_experience: 3,
});

const createJob = (
  id = 'job-uuid-001',
  status: 'draft' | 'active' | 'paused' | 'closed' = 'active',
  orgId = 'org-uuid-001'
) => ({
  id,
  title: 'Senior Software Engineer',
  description: 'Build things',
  status,
  org_id: orgId,
  thresholds: { minScore: 70 },
  rubric: { technical: 40, communication: 20, problemSolving: 25, experience: 15 },
  assessmentConfig: { aptitude_enabled: true, coding_enabled: true },
  stages: ['voice_screen'],
});

// ---------------------------------------------------------------------------
// applyToJob — unit tests
// ---------------------------------------------------------------------------

describe('Application Lifecycle — applyToJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a candidate profile if none exists and applies successfully', async () => {
    const user = createUserCtx();
    const job = createJob('job-1', 'active');

    (prisma.candidateProfile.findUnique as vi.Mock).mockResolvedValue(null);
    (prisma.candidateProfile.create as vi.Mock).mockResolvedValue(createProfile('profile-new'));
    (prisma.job.findUnique as vi.Mock).mockResolvedValue(job);
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(null);
    (prisma.application.create as vi.Mock).mockResolvedValue({
      id: 'app-uuid-001',
      candidate_id: 'profile-new',
      job_id: 'job-1',
      status: 'applied',
      job: { id: 'job-1', title: 'Senior Software Engineer', org_id: 'org-uuid-001' },
    });

    const result = await applyToJob(user, { jobId: 'job-1' });

    expect(prisma.candidateProfile.create).toHaveBeenCalledWith({
      data: { user_id: user.userId, resume_url: null },
    });
    expect(prisma.application.create).toHaveBeenCalledWith({
      data: { candidate_id: 'profile-new', job_id: 'job-1', status: 'applied' },
      include: { job: { select: { id: true, title: true, org_id: true } } },
    });
    expect(result.application.status).toBe('applied');
  });

  it('updates existing profile resume_url when provided', async () => {
    const user = createUserCtx();
    const existingProfile = createProfile('profile-existing', user.userId);
    const job = createJob('job-2', 'active');

    (prisma.candidateProfile.findUnique as vi.Mock).mockResolvedValue(existingProfile);
    (prisma.candidateProfile.update as vi.Mock).mockResolvedValue({
      ...existingProfile,
      resume_url: 'https://storage.example.com/resume.pdf',
    });
    (prisma.job.findUnique as vi.Mock).mockResolvedValue(job);
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(null);
    (prisma.application.create as vi.Mock).mockResolvedValue({
      id: 'app-2',
      candidate_id: 'profile-existing',
      job_id: 'job-2',
      status: 'applied',
      job: { id: 'job-2', title: 'Backend Engineer', org_id: 'org-uuid-001' },
    });

    const result = await applyToJob(user, {
      jobId: 'job-2',
      resumeUrl: 'https://storage.example.com/resume.pdf',
    });

    expect(prisma.candidateProfile.update).toHaveBeenCalledWith({
      where: { id: 'profile-existing' },
      data: { resume_url: 'https://storage.example.com/resume.pdf' },
    });
  });

  it('rejects application to non-open job (draft)', async () => {
    const user = createUserCtx();
    const drafts = createJob('job-draft', 'draft');

    (prisma.candidateProfile.findUnique as vi.Mock).mockResolvedValue(createProfile());
    (prisma.job.findUnique as vi.Mock).mockResolvedValue(drafts);

    await expect(applyToJob(user, { jobId: 'job-draft' })).rejects.toBeInstanceOf(
      badRequest.constructor
    );
    await expect(applyToJob(user, { jobId: 'job-draft' })).rejects.toThrow(
      'Job is not open for applications'
    );
  });

  it('rejects application to closed job', async () => {
    const user = createUserCtx();
    (prisma.candidateProfile.findUnique as vi.Mock).mockResolvedValue(createProfile());
    (prisma.job.findUnique as vi.Mock).mockResolvedValue(createJob('job-closed', 'closed'));

    await expect(applyToJob(user, { jobId: 'job-closed' })).rejects.toThrow(
      'Job is not open for applications'
    );
  });

  it('rejects duplicate applications', async () => {
    const user = createUserCtx();
    (prisma.candidateProfile.findUnique as vi.Mock).mockResolvedValue(createProfile());
    (prisma.job.findUnique as vi.Mock).mockResolvedValue(createJob('job-3', 'active'));
    (prisma.application.findUnique as vi.Mock).mockResolvedValue({
      id: 'existing-app',
      candidate_id: 'profile-existing',
      job_id: 'job-3',
      status: 'applied',
    });

    await expect(applyToJob(user, { jobId: 'job-3' })).rejects.toThrow(
      'You have already applied for this job'
    );
  });

  it('enqueues screening job after successful application', async () => {
    const user = createUserCtx();
    (prisma.candidateProfile.findUnique as vi.Mock).mockResolvedValue(createProfile('p-1'));
    (prisma.job.findUnique as vi.Mock).mockResolvedValue(createJob('j-1', 'active'));
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(null);
    (prisma.application.create as vi.Mock).mockResolvedValue({
      id: 'app-1',
      candidate_id: 'p-1',
      job_id: 'j-1',
      status: 'applied',
      job: { id: 'j-1', title: 'Engineer', org_id: 'org-1' },
    });

    const result = await applyToJob(user, { jobId: 'j-1' });

    expect(enqueueScreening).toHaveBeenCalledWith('app-1', {
      candidateId: 'p-1',
      jobId: 'j-1',
      resumeUrl: null,
      timestamp: expect.any(String),
    });
  });

  it('does not throw when screening enqueue fails (graceful degradation)', async () => {
    const user = createUserCtx();
    (prisma.candidateProfile.findUnique as vi.Mock).mockResolvedValue(createProfile());
    (prisma.job.findUnique as vi.Mock).mockResolvedValue(createJob('j-safe', 'active'));
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(null);
    (prisma.application.create as vi.Mock).mockResolvedValue({
      id: 'app-safe',
      candidate_id: 'p-safe',
      job_id: 'j-safe',
      status: 'applied',
      job: { id: 'j-safe', title: 'Safe Job', org_id: 'org-1' },
    });
    (enqueueScreening as vi.Mock).mockRejectedValue(new Error('Redis down'));

    // Should not throw — the catch block logs and continues
    await expect(applyToJob(user, { jobId: 'j-safe' })).resolves.toBeDefined();
  });

  it('sends application received email with candidate name derived from email', async () => {
    const user = createUserCtx({ email: 'john.doe@example.com' });
    (prisma.candidateProfile.findUnique as vi.Mock).mockResolvedValue(createProfile());
    (prisma.job.findUnique as vi.Mock).mockResolvedValue(createJob('j-email', 'active'));
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(null);
    (prisma.application.create as vi.Mock).mockResolvedValue({
      id: 'app-email',
      candidate_id: 'p-email',
      job_id: 'j-email',
      status: 'applied',
      job: { id: 'j-email', title: 'QA Engineer', org_id: 'org-1' },
    });

    await applyToJob(user, { jobId: 'j-email' });

    expect(emailService.sendApplicationReceived).toHaveBeenCalledWith(
      'john.doe@example.com',
      'john.doe',
      'QA Engineer'
    );
  });

  it('skips email when user has no email', async () => {
    const user = createUserCtx({ email: undefined });
    (prisma.candidateProfile.findUnique as vi.Mock).mockResolvedValue(createProfile());
    (prisma.job.findUnique as vi.Mock).mockResolvedValue(createJob('j-nomail', 'active'));
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(null);
    (prisma.application.create as vi.Mock).mockResolvedValue({
      id: 'app-nomail',
      candidate_id: 'p-nomail',
      job_id: 'j-nomail',
      status: 'applied',
      job: { id: 'j-nomail', title: 'Ghost Applicant', org_id: 'org-1' },
    });

    await applyToJob(user, { jobId: 'j-nomail' });

    expect(emailService.sendApplicationReceived).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// candidateOwnsApplication — unit tests
// ---------------------------------------------------------------------------

describe('Application Lifecycle — candidateOwnsApplication', () => {
  it('returns true when candidate owns the application', async () => {
    const userId = 'owner-uuid';
    (prisma.application.findFirst as vi.Mock).mockResolvedValue({
      id: 'app-owned',
    });

    const result = await candidateOwnsApplication('app-owned', userId);

    expect(result).toBe(true);
    expect(prisma.application.findFirst).toHaveBeenCalledWith({
      where: { id: 'app-owned', candidate: { user_id: userId } },
      select: { id: true },
    });
  });

  it('returns false when candidate does not own the application', async () => {
    (prisma.application.findFirst as vi.Mock).mockResolvedValue(null);

    const result = await candidateOwnsApplication('app-foreign', 'other-user');

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// withdrawApplication — unit tests
// ---------------------------------------------------------------------------

describe('Application Lifecycle — withdrawApplication', () => {
  it('withdraws application when candidate is owner', async () => {
    const app = {
      id: 'app-withdraw',
      candidate: { user_id: 'owner-uuid' },
      status: 'applied',
    };
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...app,
      status: 'withdrawn',
    });

    const result = await withdrawApplication('app-withdraw', 'owner-uuid');

    expect(prisma.application.update).toHaveBeenCalledWith({
      where: { id: 'app-withdraw' },
      data: { status: 'withdrawn' },
    });
    expect(result.application.status).toBe('withdrawn');
    expect(result.message).toBe('Application withdrawn successfully');
  });

  it('throws notFound when application does not exist', async () => {
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(null);

    await expect(withdrawApplication('ghost-app', 'some-user')).rejects.toThrow(
      'Application not found'
    );
  });

  it('throws forbidden when candidate is not the owner', async () => {
    const app = {
      id: 'app-protected',
      candidate: { user_id: 'owner-uuid' },
      status: 'applied',
    };
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);

    await expect(withdrawApplication('app-protected', 'impersonator-uuid')).rejects.toThrow(
      'Forbidden: Access denied to application'
    );
  });
});

// ---------------------------------------------------------------------------
// Pipeline helpers — ensureInterviewAndSchedule
// ---------------------------------------------------------------------------

import { ensureInterviewAndSchedule, advanceAssessmentStage, PAST_ASSESSMENT } from '../lib/pipeline';

describe('Pipeline — ensureInterviewAndSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates interview and enqueues scheduling when none exists', async () => {
    const app = {
      id: 'app-pipe',
      job: {
        title: 'Pipeline Engineer',
        org_id: 'org-pipe',
        organization: {
          id: 'org-pipe',
          settings: {
            availabilityHours: {
              timezone: 'America/New_York',
              mon: ['09:00', '17:00'],
              tue: ['09:00', '17:00'],
            },
          },
        },
      },
      interview: null,
      candidate: { include: { user: { email: 'pipe@test.com' } } },
    };
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);
    (prisma.interview.create as vi.Mock).mockResolvedValue({ id: 'int-pipe' });

    const result = await ensureInterviewAndSchedule('app-pipe');

    expect(prisma.interview.create).toHaveBeenCalledWith({
      data: { application_id: 'app-pipe', status: 'scheduled' },
    });
    expect(result.interviewId).toBe('int-pipe');
  });

  it('returns existing interview if already present', async () => {
    const existingInterview = { id: 'int-existing' };
    const app = {
      id: 'app-existing',
      job: { title: 'Existing', org_id: 'org-x', organization: { id: 'org-x', settings: {} } },
      interview: existingInterview,
      candidate: { include: { user: { email: 'existing@test.com' } } },
    };
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);

    const result = await ensureInterviewAndSchedule('app-existing');

    expect(prisma.interview.create).not.toHaveBeenCalled();
    expect(result.interviewId).toBe('int-existing');
  });

  it('returns null when application not found', async () => {
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(null);

    const result = await ensureInterviewAndSchedule('ghost-app');

    expect(result.interviewId).toBeNull();
  });
});

describe('Pipeline — advanceAssessmentStage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns current status when already past assessment stages', async () => {
    for (const status of PAST_ASSESSMENT) {
      (prisma.application.findUnique as vi.Mock).mockResolvedValue({
        id: 'app-advance',
        status,
        job: {} as any,
        interview: null,
        evaluations: [],
      });

      const result = await advanceAssessmentStage('app-advance');
      expect(result).toBe(status);
    }
  });

  it('returns null when aptitude or coding not yet done (and both enabled)', async () => {
    (prisma.application.findUnique as vi.Mock).mockResolvedValue({
      id: 'app-pending',
      status: 'assessment',
      job: {
        assessmentConfig: { aptitude_enabled: true, coding_enabled: true },
        thresholds: {},
        stages: [],
      } as any,
      interview: null,
      evaluations: [{ resume_score: 80 }], // no aptitude_score, no coding_score
    });

    const result = await advanceAssessmentStage('app-pending');
    expect(result).toBeNull();
  });

  it('advances to hr_round when both modalities complete without voice screen', async () => {
    (prisma.application.findUnique as vi.Mock).mockResolvedValue({
      id: 'app-done',
      status: 'assessment',
      job: {
        assessmentConfig: { aptitude_enabled: true, coding_enabled: true },
        thresholds: {},
        stages: [], // no voice_screen
      } as any,
      interview: null,
      evaluations: [{ aptitude_score: 85, coding_score: 78 }],
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      id: 'app-done',
      status: 'hr_round',
      hr_round_status: 'pending',
    });

    const result = await advanceAssessmentStage('app-done');

    expect(result).toBe('hr_round');
    expect(prisma.application.update).toHaveBeenCalledWith({
      where: { id: 'app-done' },
      data: { status: 'hr_round', hr_round_status: 'pending' },
    });
  });

  it('advances to interview_scheduled when voice screen enabled and both scores done', async () => {
    (prisma.application.findUnique as vi.Mock).mockResolvedValue({
      id: 'app-voice',
      status: 'assessment',
      job: {
        assessmentConfig: { aptitude_enabled: true, coding_enabled: true },
        thresholds: {},
        stages: ['voice_screen'],
      } as any,
      interview: { id: 'int-voice' },
      evaluations: [{ aptitude_score: 70, coding_score: 65 }],
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      id: 'app-voice',
      status: 'interview_scheduled',
    });

    const result = await advanceAssessmentStage('app-voice');

    expect(result).toBe('interview_scheduled');
  });

  it('stays at screening_completed when voice screen enabled but no interview created', async () => {
    (prisma.application.findUnique as vi.Mock).mockResolvedValue({
      id: 'app-noint',
      status: 'assessment',
      job: {
        assessmentConfig: { aptitude_enabled: true, coding_enabled: true },
        thresholds: {},
        stages: ['voice_screen'],
      } as any,
      interview: null,
      evaluations: [{ aptitude_score: 70, coding_score: 65 }],
    });

    const result = await advanceAssessmentStage('app-noint');

    expect(result).toBe('screening_completed');
  });
});

// ---------------------------------------------------------------------------
// Application query service tests
// ---------------------------------------------------------------------------

import {
  getApplicationById,
  getApplicationsByJobId,
  getCandidateApplications,
} from '../services/application/application-query.service';

describe('Application Query — getApplicationById', () => {
  it('returns application with full relation tree', async () => {
    const app = {
      id: 'app-q1',
      candidate_id: 'cp-q1',
      job_id: 'j-q1',
      status: 'screening_completed',
      candidate: {
        id: 'cp-q1',
        user_id: 'u-q1',
        headline: 'Backend Engineer',
      },
      job: { id: 'j-q1', title: 'Backend Role' },
      evaluations: [{ id: 'ev-q1', stage: 'screening', resume_score: 75 }],
    };
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);

    const result = await getApplicationById('app-q1', 'u-q1', 'candidate');

    expect(result.id).toBe('app-q1');
    expect(result.evaluations).toHaveLength(1);
  });

  it('returns 404 when application not found', async () => {
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(null);

    await expect(getApplicationById('ghost-app-q', 'u-q', 'candidate')).rejects.toThrow(
      'Application not found'
    );
  });

  it('enforces HR org isolation', async () => {
    const app = {
      id: 'app-isolation',
      candidate_id: 'cp-iso',
      job_id: 'j-iso',
      status: 'applied',
      job: { id: 'j-iso', org_id: 'org-other' },
    };
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);

    await expect(
      getApplicationById('app-isolation', 'u-iso', 'hr', 'org-my-org')
    ).rejects.toThrow('Organization mismatch');
  });
});

// ---------------------------------------------------------------------------
// Application stage service tests
// ---------------------------------------------------------------------------

import { transitionApplicationStatus } from '../services/application/application-stage.service';

describe('Application Stage — transitionApplicationStatus', () => {
  it('advances status to next valid stage', async () => {
    const app = {
      id: 'app-stage',
      status: 'screening_completed',
      job: { id: 'j-stage', org_id: 'org-stage' },
      candidate: { id: 'cp-stage', user_id: 'u-stage' },
    };
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...app,
      status: 'assessment',
    });

    const result = await transitionApplicationStatus('app-stage', 'assessment', 'hr', 'org-stage');

    expect(result.status).toBe('assessment');
  });

  it('rejects invalid stage transitions', async () => {
    const app = {
      id: 'app-invalid',
      status: 'applied',
      job: { id: 'j-inv', org_id: 'org-inv' },
    };
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);

    await expect(
      transitionApplicationStatus('app-invalid', 'offered', 'hr', 'org-inv')
    ).rejects.toThrow('Invalid status transition');
  });

  it('throws when application not found', async () => {
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(null);
    await expect(
      transitionApplicationStatus('ghost-stage', 'assessment', 'hr', 'org-x')
    ).rejects.toThrow('Application not found');
  });
});
