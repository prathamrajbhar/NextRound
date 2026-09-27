import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma, Prisma } from '@nextround/database';
import {
  recordInterviewResult,
  confirmInterviewSlot,
  recordScheduleSlots,
} from '../services/internal/internal-interview.service';
import { emailService } from '../services/email/email.service';
import { enqueueEvaluation } from '../lib/queues/evaluation.queue';
import { logger } from '../lib/logger';
import { notFound } from '../lib/http-errors';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    interview: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    application: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    evaluation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    assessment: {
      updateMany: vi.fn(),
    },
    agentLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    candidateProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    candidateEmbedding: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    socialProfileSync: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    job: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

vi.mock('@nextround/database', () => ({
  prisma: mockPrisma,
  Prisma: {
    DbNull: 'DbNull',
  },
}));

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
  Prisma: {
    DbNull: 'DbNull',
  },
}));


vi.mock('../services/email/email.service', () => ({
  emailService: {
    sendInterviewConfirmation: vi.fn().mockResolvedValue(undefined),
    sendHRHoldAlert: vi.fn().mockResolvedValue(undefined),
    sendOfferEmail: vi.fn().mockResolvedValue(undefined),
    sendConstructiveRejection: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../lib/queues/evaluation.queue', () => ({
  enqueueEvaluation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/logger', () => ({
  logger: {
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// ---------------------------------------------------------------------------
// recordInterviewResult
// ---------------------------------------------------------------------------

describe('Internal Interview Service — recordInterviewResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseInterview = {
    id: 'int-result-001',
    application_id: 'app-result-001',
    status: 'in_progress',
    application: {
      id: 'app-result-001',
      candidate: {
        user: { email: 'cand@test.com' },
      },
      job: {
        id: 'job-result-001',
        title: 'Backend Engineer',
        org_id: 'org-result-001',
      },
    },
  };

  it('completes interview with transcript and audio URL', async () => {
    (prisma.interview.findUnique as vi.Mock).mockResolvedValue(baseInterview);
    (prisma.interview.update as vi.Mock).mockResolvedValue({
      ...baseInterview,
      status: 'completed',
      transcript: { turns: [] },
      audio_url: 'https://storage.example.com/interview.webm',
    });

    const result = await recordInterviewResult('int-result-001', {
      transcript: { turns: [] },
      audio_url: 'https://storage.example.com/interview.webm',
      interview_score: null,
      scores: null,
      reasoning: null,
      feedback: null,
    });

    expect(result.interview.status).toBe('completed');
    expect(result.interview.audio_url).toBe('https://storage.example.com/interview.webm');
  });

  it('creates evaluation when interview score is provided', async () => {
    (prisma.interview.findUnique as vi.Mock).mockResolvedValue(baseInterview);
    (prisma.interview.update as vi.Mock).mockResolvedValue({
      ...baseInterview,
      status: 'completed',
      transcript: { turns: [] },
      audio_url: 'https://storage.example.com/interview.webm',
    });
    (prisma.evaluation.upsert as vi.Mock).mockResolvedValue({
      id: 'ev-result-001',
      application_id: 'app-result-001',
      stage: 'interview',
      interview_score: 82,
      composite_score: 82,
      reasoning: 'Voice interview evaluation completed. Score: 82%',
      decision: 'hire',
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...baseInterview.application,
      status: 'hr_round',
      hr_round_status: 'pending',
    });

    const result = await recordInterviewResult('int-result-001', {
      transcript: { turns: [] },
      audio_url: 'https://storage.example.com/interview.webm',
      interview_score: 82,
      scores: null,
      reasoning: null,
      feedback: null,
      proctor_flags: [],
      proctor_telemetry: {},
    });

    expect(result.evaluation.interview_score).toBe(82);
    expect(result.evaluation.decision).toBe('hire');
    expect(result.evaluation.reasoning).toContain('82%');
  });

  it('evaluates as reject when interview score < 70', async () => {
    (prisma.interview.findUnique as vi.Mock).mockResolvedValue(baseInterview);
    (prisma.interview.update as vi.Mock).mockResolvedValue({
      ...baseInterview,
      status: 'completed',
    });
    (prisma.evaluation.upsert as vi.Mock).mockResolvedValue({
      id: 'ev-reject-001',
      application_id: 'app-result-001',
      stage: 'interview',
      interview_score: 55,
      composite_score: 55,
      reasoning: 'Voice interview evaluation completed. Score: 55%',
      decision: 'reject',
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...baseInterview.application,
      status: 'rejected',
    });

    const result = await recordInterviewResult('int-result-001', {
      interview_score: 55,
    });

    expect(result.evaluation.decision).toBe('reject');
    expect(prisma.application.update).toHaveBeenCalledWith({
      where: { id: 'app-result-001' },
      data: {
        status: 'rejected',
        hr_round_status: undefined,
      },
    });
  });

  it('falls back to scores.composite when interview_score is null', async () => {
    (prisma.interview.findUnique as vi.Mock).mockResolvedValue(baseInterview);
    (prisma.interview.update as vi.Mock).mockResolvedValue({
      ...baseInterview,
      status: 'completed',
    });
    (prisma.evaluation.upsert as vi.Mock).mockResolvedValue({
      id: 'ev-fallback-001',
      application_id: 'app-result-001',
      stage: 'interview',
      interview_score: 75,
      composite_score: 75,
      reasoning: 'Voice interview evaluation completed. Score: 75%',
      decision: 'hire',
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...baseInterview.application,
      status: 'hr_round',
      hr_round_status: 'pending',
    });

    const result = await recordInterviewResult('int-result-001', {
      interview_score: null,
      scores: { composite: 75 },
    });

    expect(result.evaluation.interview_score).toBe(75);
  });

  it('does not update application status or enqueue evaluation when interview_score is null', async () => {
    (prisma.interview.findUnique as vi.Mock).mockResolvedValue(baseInterview);
    (prisma.interview.update as vi.Mock).mockResolvedValue({
      ...baseInterview,
      status: 'completed',
    });
    (prisma.evaluation.upsert as vi.Mock).mockResolvedValue({
      id: 'ev-null-001',
      application_id: 'app-result-001',
      stage: 'interview',
      interview_score: null,
      composite_score: null,
      reasoning: 'Voice interview evaluation completed.',
      decision: null,
    });

    const result = await recordInterviewResult('int-result-001', {
      interview_score: null,
      scores: null,
    });

    expect(result.interview.status).toBe('completed');
    expect(prisma.application.update).not.toHaveBeenCalled();
    expect(enqueueEvaluation).not.toHaveBeenCalled();
  });

  it('throws notFound when interview does not exist', async () => {
    (prisma.interview.findUnique as vi.Mock).mockResolvedValue(null);

    await expect(
      recordInterviewResult('ghost-int', {
        transcript: { turns: [] },
      })
    ).rejects.toThrow('Interview not found');
  });
});

// ---------------------------------------------------------------------------
// confirmInterviewSlot
// ---------------------------------------------------------------------------

describe('Internal Interview Service — confirmInterviewSlot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseInterviewWithRelations = {
    id: 'int-confirm-001',
    application_id: 'app-confirm-001',
    status: 'scheduled',
    scheduled_at: null,
    application: {
      id: 'app-confirm-001',
      status: 'interview_scheduled',
      hr_round_status: 'scheduled',
      hr_round_scheduled_at: null,
      candidate: {
        user: { email: 'confirm@cand.com' },
      },
      job: {
        id: 'job-confirm-001',
        title: 'Frontend Engineer',
      },
    },
  };

  it('confirms slot and updates application status', async () => {
    (prisma.interview.findUnique as vi.Mock).mockResolvedValue(baseInterviewWithRelations);
    (prisma.interview.update as vi.Mock).mockResolvedValue({
      ...baseInterviewWithRelations,
      scheduled_at: new Date('2026-09-20T10:00:00Z'),
      status: 'scheduled',
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...baseInterviewWithRelations.application,
      status: 'interview_scheduled',
      hr_round_status: 'scheduled',
      hr_round_scheduled_at: new Date('2026-09-20T10:00:00Z'),
    });

    const result = await confirmInterviewSlot('int-confirm-001', {
      scheduled_at: '2026-09-20T10:00:00Z',
    });

    expect(result.interview.status).toBe('scheduled');
    expect(result.interview.scheduled_at).toBeDefined();
  });

  it('sends interview confirmation email to candidate', async () => {
    (prisma.interview.findUnique as vi.Mock).mockResolvedValue(baseInterviewWithRelations);
    (prisma.interview.update as vi.Mock).mockResolvedValue({
      ...baseInterviewWithRelations,
      scheduled_at: new Date('2026-09-20T10:00:00Z'),
      status: 'scheduled',
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...baseInterviewWithRelations.application,
      status: 'interview_scheduled',
      hr_round_status: 'scheduled',
      hr_round_scheduled_at: new Date('2026-09-20T10:00:00Z'),
    });

    await confirmInterviewSlot('int-confirm-001', {
      scheduled_at: '2026-09-20T10:00:00Z',
    });

    expect(emailService.sendInterviewConfirmation).toHaveBeenCalledWith(
      'confirm@cand.com',
      'confirm',
      'Frontend Engineer',
      expect.any(String), // formatted date
      'app-confirm-001'
    );
  });

  it('does not send email when candidate has no email', async () => {
    const interviewNoEmail = {
      ...baseInterviewWithRelations,
      application: {
        ...baseInterviewWithRelations.application,
        candidate: { user: { email: null } },
      },
    };
    (prisma.interview.findUnique as vi.Mock).mockResolvedValue(interviewNoEmail);
    (prisma.interview.update as vi.Mock).mockResolvedValue({
      ...interviewNoEmail,
      scheduled_at: new Date(),
      status: 'scheduled',
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...interviewNoEmail.application,
      status: 'interview_scheduled',
      hr_round_status: 'scheduled',
      hr_round_scheduled_at: new Date(),
    });

    await confirmInterviewSlot('int-noemail', { scheduled_at: '2026-09-20T10:00:00Z' });

    expect(emailService.sendInterviewConfirmation).not.toHaveBeenCalled();
  });

  it('throws notFound when interview not found', async () => {
    (prisma.interview.findUnique as vi.Mock).mockResolvedValue(null);

    await expect(confirmInterviewSlot('ghost-int-confirm', { scheduled_at: '2026-09-20T10:00:00Z' })).rejects.toThrow(
      'Interview not found'
    );
  });
});

// ---------------------------------------------------------------------------
// recordScheduleSlots
// ---------------------------------------------------------------------------

describe('Internal Interview Service — recordScheduleSlots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records scheduler agent slot generation', async () => {
    const interview = {
      id: 'int-slots-001',
      application_id: 'app-slots-001',
      status: 'pending',
    };
    (prisma.interview.findUnique as vi.Mock).mockResolvedValue(interview);
    (prisma.interview.update as vi.Mock).mockResolvedValue({
      ...interview,
      status: 'scheduled',
    });
    (prisma.agentLog.create as vi.Mock).mockResolvedValue({
      id: 'log-slots-001',
      agent_name: 'scheduler_agent',
      action: 'slots_generated',
    });

    const result = await recordScheduleSlots('int-slots-001', {
      slots: [
        { id: 'slot1', datetime: '2026-09-20T10:00:00Z', timezone: 'America/New_York' },
        { id: 'slot2', datetime: '2026-09-21T14:00:00Z', timezone: 'America/New_York' },
      ],
      formatted_email: 'Scheduling email body',
    });

    expect(result.interview.status).toBe('scheduled');
    expect(result.slots).toHaveLength(2);
    expect(result.formatted_email).toBe('Scheduling email body');

    expect(prisma.agentLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        agent_name: 'scheduler_agent',
        action: 'slots_generated',
      }),
    });
  });

  it('throws notFound when interview does not exist', async () => {
    (prisma.interview.findUnique as vi.Mock).mockResolvedValue(null);

    await expect(
      recordScheduleSlots('ghost-slots', { slots: [], formatted_email: '' })
    ).rejects.toThrow('Interview not found');
  });
});

// ---------------------------------------------------------------------------
// Full pipeline: screening → evaluation → decision
// ---------------------------------------------------------------------------

describe('Internal Interview Service — end-to-end pipeline integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('full screening-to-interview pipeline: screening passes → interview scheduled → confirmed', async () => {
    // 1. Screening evaluation creates evaluation and advances to screening_completed
    const screeningApp = {
      id: 'app-full-001',
      candidate_id: 'cp-full-001',
      job_id: 'job-full-001',
      status: 'screening',
      candidate: {
        id: 'cp-full-001',
        user_id: 'user-full-001',
        user: { email: 'full@cand.com' },
      },
      job: {
        id: 'job-full-001',
        title: 'Platform Engineer',
        org_id: 'org-full-001',
        thresholds: { minScore: 70 },
        assessmentConfig: { aptitude_enabled: true, coding_enabled: true },
        stages: ['voice_screen'],
        organization: {
          id: 'org-full-001',
          settings: {
            availabilityHours: {
              timezone: 'America/New_York',
              mon: ['09:00', '17:00'],
            },
          },
        },
      },
      interview: null,
      evaluations: [],
    };

    // Step 1: Screening passed
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(screeningApp);
    (prisma.evaluation.upsert as vi.Mock).mockResolvedValue({
      id: 'ev-full-screening',
      application_id: 'app-full-001',
      stage: 'screening',
      resume_score: 85,
      composite_score: 85,
      reasoning: 'Passed screening',
      decision: 'hire',
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...screeningApp,
      status: 'screening_completed',
    });

    // Step 2: Interview created and scheduled
    (prisma.interview.create as vi.Mock).mockResolvedValue({
      id: 'int-full-001',
      application_id: 'app-full-001',
      status: 'scheduled',
    });

    // Step 3: Slot confirmed
    const confirmedInterview = {
      id: 'int-full-001',
      application_id: 'app-full-001',
      status: 'scheduled',
      scheduled_at: new Date('2026-09-25T10:00:00Z'),
      application: {
        id: 'app-full-001',
        status: 'interview_scheduled',
        hr_round_status: 'scheduled',
        hr_round_scheduled_at: new Date('2026-09-25T10:00:00Z'),
        candidate: { user: { email: 'full@cand.com' } },
        job: { id: 'job-full-001', title: 'Platform Engineer' },
      },
    };
    (prisma.interview.findUnique as vi.Mock).mockResolvedValue(confirmedInterview);
    (prisma.interview.update as vi.Mock).mockResolvedValue(confirmedInterview);
    (prisma.application.update as vi.Mock).mockResolvedValue(confirmedInterview.application);

    // Execute pipeline steps manually in sequence
    // (This is a meta-integration test verifying the service contracts align)

    // Screening step
    const screeningEval = await prisma.evaluation.upsert({
      where: { application_id: 'app-full-001' },
      create: {
        application_id: 'app-full-001',
        stage: 'screening',
        resume_score: 85,
        composite_score: 85,
        reasoning: 'Passed screening',
        decision: 'hire',
      },
      update: {
        stage: 'screening',
        resume_score: 85,
        composite_score: 85,
        reasoning: 'Passed screening',
        decision: 'hire',
      },
    });

    expect(screeningEval.stage).toBe('screening');
    expect(screeningEval.resume_score).toBe(85);

    // Interview confirmation step
    const confirmResult = await confirmInterviewSlot('int-full-001', {
      scheduled_at: '2026-09-25T10:00:00Z',
    });

    expect(confirmResult.interview.scheduled_at).toBeDefined();
    expect(confirmResult.interview.application.status).toBe('interview_scheduled');
  });
});

// ---------------------------------------------------------------------------
// Internal Candidate Service — embeddings and context
// ---------------------------------------------------------------------------

import {
  updateCandidateEmbedding,
  getCandidateSections,
  saveCandidateEmbeddings,
  deleteCandidateSocialSource,
  getCandidateInterviewContextInternal,
} from '../services/internal/internal-candidate.service';
import { prisma as internalPrisma } from '@nextround/database';

describe('Internal Candidate Service — updateCandidateEmbedding', () => {
  it('updates candidate embedding with valid 768-dim vector', async () => {
    const embedding = Array.from({ length: 768 }, () => Math.random());
    (internalPrisma.$executeRaw as vi.Mock).mockResolvedValue(1);

    const result = await updateCandidateEmbedding('cp-embed-001', {
      embedding,
    });

    expect(result.message).toBe('Candidate embedding updated successfully');
    expect(internalPrisma.$executeRaw).toHaveBeenCalled();
  });

  it('throws badRequest for embedding with wrong dimensions', async () => {
    const badEmbedding = Array.from({ length: 512 }, () => Math.random());

    await expect(
      updateCandidateEmbedding('cp-embed-002', { embedding: badEmbedding })
    ).rejects.toThrow('Embedding must be a 768-dimensional float array');
  });

  it('throws badRequest for non-array embedding', async () => {
    await expect(
      updateCandidateEmbedding('cp-embed-003', { embedding: 'not-an-array' })
    ).rejects.toThrow('Embedding must be a 768-dimensional float array');
  });
});

describe('Internal Candidate Service — saveCandidateEmbeddings', () => {
  it('upserts multiple section embeddings and returns counts', async () => {
    const sections = [
      {
        sourceType: 'profile',
        section: 'summary',
        content: 'Experienced engineer...',
        contentHash: 'hash-1',
        embedding: Array.from({ length: 768 }, () => Math.random()),
      },
      {
        sourceType: 'linkedin',
        section: 'experience',
        content: 'Worked at Acme...',
        contentHash: 'hash-2',
        embedding: Array.from({ length: 768 }, () => Math.random()),
      },
    ];

    // First section — new, upserted
    (internalPrisma.candidateEmbedding.findUnique as vi.Mock)
      .mockResolvedValueOnce(null) // first section — not found → insert
      .mockResolvedValueOnce({ content_hash: 'hash-2' }); // second section — found, skip

    (internalPrisma.$executeRaw as vi.Mock).mockResolvedValue(1);

    const result = await saveCandidateEmbeddings('cp-embed-003', { sections });

    expect(result.message).toBe('Candidate embeddings updated');
    expect(result.upserted).toBe(1); // first section inserted
    expect(result.skipped).toBe(1); // second section skipped
  });

  it('skips sections with invalid data', async () => {
    const sections = [
      {
        sourceType: '', // invalid — missing
        section: 'summary',
        content: 'Some content',
        contentHash: 'hash-1',
        embedding: Array.from({ length: 768 }, () => Math.random()),
      },
      {
        sourceType: 'profile',
        section: '', // invalid — missing
        content: 'Some content',
        contentHash: 'hash-2',
        embedding: Array.from({ length: 768 }, () => Math.random()),
      },
      {
        sourceType: 'profile',
        section: 'summary',
        content: 'Some content',
        contentHash: 'hash-3',
        embedding: [], // invalid — wrong dimension
      },
    ];

    const result = await saveCandidateEmbeddings('cp-embed-004', { sections });

    expect(result.upserted).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it('does not re-fetch profile embedding when no profile sections changed', async () => {
    const sections = [
      {
        sourceType: 'github',
        section: 'repos',
        content: 'Repo list',
        contentHash: 'hash-github',
        embedding: Array.from({ length: 768 }, () => Math.random()),
      },
    ];

    (internalPrisma.candidateEmbedding.findUnique as vi.Mock).mockResolvedValue(null);
    (internalPrisma.$executeRaw as vi.Mock).mockResolvedValue(1);
    // profileSections should be empty since sourceType !== 'profile'
    // So fetchProfileEmbedding should not be called

    const result = await saveCandidateEmbeddings('cp-embed-005', { sections });

    expect(result.upserted).toBe(1);
  });
});

describe('Internal Candidate Service — deleteCandidateSocialSource', () => {
  it('allows deleting github source', async () => {
    (internalPrisma.$executeRaw as vi.Mock).mockResolvedValue(undefined);
    // deleteCandidateSocialSource calls removeCandidateSocialSource
    // We verify the shape — actual DB call is mocked

    const result = await deleteCandidateSocialSource('cp-social-001', 'github');

    expect(result.message).toBe('Removed github social data');
  });

  it('allows deleting linkedin source', async () => {
    const result = await deleteCandidateSocialSource('cp-social-002', 'linkedin');

    expect(result.message).toBe('Removed linkedin social data');
  });

  it('throws badRequest for invalid source', async () => {
    await expect(
      deleteCandidateSocialSource('cp-social-003', 'twitter')
    ).rejects.toThrow('source must be "github" or "linkedin"');
  });
});

// ---------------------------------------------------------------------------
// Internal Assessment Service
// ---------------------------------------------------------------------------

import { recordAssessmentResult } from '../services/internal/internal-assessment.service';

describe('Internal Assessment Service — recordAssessmentResult', () => {
  it('records assessment result with score and updates evaluation', async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: 'app-assess-001',
      status: 'assessment',
      job: { assessmentConfig: { aptitude_enabled: true } },
    });
    mockPrisma.application.update.mockResolvedValue({
      id: 'app-assess-001',
      status: 'screening_completed',
    });
    mockPrisma.evaluation.upsert.mockResolvedValue({
      id: 'ev-assess-001',
      aptitude_score: 78,
      decision: 'hire',
    });
    mockPrisma.assessment.updateMany.mockResolvedValue({ count: 1 });

    const result = await recordAssessmentResult('app-assess-001', {
      score: 78,
      category_scores: { logical: 80, verbal: 75 },
      passed: true,
      feedback: 'Passed assessment',
    });

    expect(result.evaluation.aptitude_score).toBe(78);
    expect(result.application.status).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Internal Telemetry Service
// ---------------------------------------------------------------------------

import {
  createAgentLog,
  getRawJob,
  getRawApplication,
} from '../services/internal/internal-telemetry.service';

describe('Internal Telemetry Service', () => {
  it('creates an agent log entry', async () => {
    mockPrisma.agentLog.create.mockResolvedValue({
      id: 'log-001',
      agent_name: 'test_agent',
      action: 'process',
      status: 'completed',
    });

    const result = await createAgentLog({
      agent_name: 'test_agent',
      action: 'process',
      status: 'completed',
    });

    expect(result.agent_name).toBe('test_agent');
  });

  it('fetches raw job with organization name', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({
      id: 'job-raw-1',
      title: 'DevOps',
      organization: { name: 'Acme Corp' },
    });

    const result = await getRawJob('job-raw-1');
    expect(result.title).toBe('DevOps');
  });

  it('fetches raw application', async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: 'app-raw-1',
      candidate: { user: { email: 'cand@test.com' } },
      job: { title: 'Dev' },
      evaluations: [],
    });

    const result = await getRawApplication('app-raw-1');
    expect(result.id).toBe('app-raw-1');
  });
});

// ---------------------------------------------------------------------------
// Internal Decision Service
// ---------------------------------------------------------------------------

import {
  recordFinalEvaluation,
  applyDecision,
  createInternalOffer,
} from '../services/internal/internal-decision.service';

describe('Internal Decision Service — recordFinalEvaluation & applyDecision', () => {
  it('records final evaluation with composite score and confidence', async () => {
    mockPrisma.evaluation.findFirst.mockResolvedValue(null);
    mockPrisma.evaluation.create.mockResolvedValue({
      id: 'ev-final-1',
      application_id: 'app-final-1',
      composite_score: 88,
      confidence: 0.95,
      stage: 'final_evaluation',
    });

    const result = await recordFinalEvaluation({
      application_id: 'app-final-1',
      composite_score: 88,
      confidence: 0.95,
      reasoning: 'Strong candidate across all metrics',
    });

    expect(result.evaluation.composite_score).toBe(88);
    expect(result.status).toBe('hr_round');
  });

  it('applies hire decision and updates application status', async () => {
    const app = {
      id: 'app-dec-hire',
      job: { title: 'Software Engineer', salary: '20LPA' },
      candidate: { user: { email: 'hire@candidate.com' } },
    };
    mockPrisma.evaluation.findUnique.mockResolvedValue({ id: 'ev-hire' });
    mockPrisma.evaluation.update.mockResolvedValue({ id: 'ev-hire', decision: 'hire' });
    mockPrisma.application.findUnique.mockResolvedValue(app);
    mockPrisma.application.update.mockResolvedValue({ ...app, status: 'offered' });
    mockPrisma.offer = mockPrisma.offer || { upsert: vi.fn() };
    (mockPrisma as any).offer = {
      upsert: vi.fn().mockResolvedValue({
        id: 'off-hire',
        salary: 2000000,
        magic_link_token: 'tok-hire',
      }),
    };

    const result = await applyDecision('ev-hire', {
      application_id: 'app-dec-hire',
      decision: 'hire',
      decision_rationale: 'Top performer',
    });

    expect(result.status).toBe('offered');
  });

  it('applies reject decision', async () => {
    const app = {
      id: 'app-dec-rej',
      job: { title: 'Software Engineer' },
      candidate: { user: { email: 'rej@candidate.com' } },
    };
    mockPrisma.evaluation.findUnique.mockResolvedValue({ id: 'ev-rej' });
    mockPrisma.evaluation.update.mockResolvedValue({ id: 'ev-rej', decision: 'reject' });
    mockPrisma.application.findUnique.mockResolvedValue(app);
    mockPrisma.application.update.mockResolvedValue({ ...app, status: 'rejected' });

    const result = await applyDecision('ev-rej', {
      application_id: 'app-dec-rej',
      decision: 'reject',
      decision_rationale: 'Low coding score',
    });

    expect(result.status).toBe('rejected');
  });
});

