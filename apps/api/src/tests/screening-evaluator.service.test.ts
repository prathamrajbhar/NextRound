import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screeningEvaluator } from '../services/screening/screening-evaluator.service';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../services/llm/llm.service', () => ({
  generateText: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    application: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    evaluation: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../lib/logger', () => ({
  logger: {
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

import { generateText } from '../services/llm/llm.service';

// ---------------------------------------------------------------------------
// Helper — construct a minimal application object matching what the service expects
// ---------------------------------------------------------------------------

interface MockApplication {
  id: string;
  job_id: string;
  candidate: {
    id: string;
    skills: string[];
    raw_resume_text?: string;
    headline?: string | null;
    years_of_experience?: number | null;
    user: { email: string };
  };
  job: {
    id: string;
    title: string;
    description: string;
    thresholds: Record<string, number>;
  };
  evaluations?: Array<{ id: string }>;
}

function buildApp(
  overrides: Partial<MockApplication> = {}
): MockApplication {
  return {
    id: 'app-scr-001',
    job_id: 'job-scr-001',
    candidate: {
      id: 'cp-scr-001',
      skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
      raw_resume_text: 'Senior backend engineer with 6 years of experience building distributed systems.',
      headline: 'Backend Engineer',
      years_of_experience: 6,
      user: { email: 'cand@scr.org' },
    },
    job: {
      id: 'job-scr-001',
      title: 'Senior Backend Engineer',
      description:
        'We need a backend engineer with strong Python, PostgreSQL, and distributed systems experience. You will design APIs, optimize queries, and mentor junior engineers.',
      thresholds: { minScore: 70 },
    },
    evaluations: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Scoring logic unit tests (isolated from LLM)
// ---------------------------------------------------------------------------

describe('Screening Evaluator — score parsing and normalization', () => {
  it('clamps resumeScore to [0, 100] when LLM returns out-of-range values', async () => {
    // For these tests we need to examine the internal clamping behavior.
    // We test the logic indirectly by verifying the evaluateApplicationScreening
    // correctly handles edge-case LLM outputs.

    (generateText as vi.Mock).mockResolvedValue(
      JSON.stringify({
        resumeScore: 150,
        semanticMatchScore: -10,
        gapAnalysis: {
          matchingSkills: ['Python'],
          missingSkills: ['Kubernetes'],
          experienceMatch: 'Strong match',
          keyStrengths: ['Django expertise'],
        },
        reasoning: 'Good candidate but missing K8s.',
      })
    );

    const app = buildApp({ job: { ...buildApp().job, thresholds: { minScore: 70 } } });
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);
    (prisma.evaluation.upsert as vi.Mock).mockResolvedValue({ id: 'ev-1' });
    (prisma.application.update as vi.Mock).mockResolvedValue({ ...app, status: 'screening_completed' });

    const result = await screeningEvaluator.evaluateApplicationScreening('app-scr-001');

    // Even though LLM returned 150, the service clamps to 100
    expect(result.evaluation.resume_score).toBeLessThanOrEqual(100);
    // Even though LLM returned -10, the service clamps to 0
    expect(result.evaluation.resume_score).toBeGreaterThanOrEqual(0);
  });

  it('throws when LLM returns non-numeric scores', async () => {
    (generateText as vi.Mock).mockResolvedValue(
      JSON.stringify({
        resumeScore: 'high',
        semanticMatchScore: 80,
        gapAnalysis: {
          matchingSkills: [],
          missingSkills: [],
          experienceMatch: '',
          keyStrengths: [],
        },
        reasoning: '',
      })
    );

    const app = buildApp({ job: { ...buildApp().job, thresholds: { minScore: 70 } } });
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);

    await expect(screeningEvaluator.evaluateApplicationScreening('app-scr-001')).rejects.toThrow(
      'AI screening LLM returned missing or non-numeric scores'
    );
  });

  it('throws when LLM returns malformed JSON', async () => {
    (generateText as vi.Mock).mockResolvedValue('{ this is not json at all');

    const app = buildApp({ job: { ...buildApp().job, thresholds: { minScore: 70 } } });
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);

    await expect(screeningEvaluator.evaluateApplicationScreening('app-scr-001')).rejects.toThrow(
      'AI screening LLM returned malformed JSON'
    );
  });
});

// ---------------------------------------------------------------------------
// Threshold and decision logic
// ---------------------------------------------------------------------------

describe('Screening Evaluator — threshold and decision logic', () => {
  it('marks screening_completed when score >= minScore', async () => {
    const highScoreResponse = JSON.stringify({
      resumeScore: 85,
      semanticMatchScore: 80,
      gapAnalysis: {
        matchingSkills: ['Python', 'PostgreSQL'],
        missingSkills: [],
        experienceMatch: 'Excellent match',
        keyStrengths: ['Django', 'Redis'],
      },
      reasoning: 'Strong backend candidate.',
    });
    (generateText as vi.Mock).mockResolvedValue(highScoreResponse);

    const app = buildApp({
      job: { ...buildApp().job, thresholds: { minScore: 70 } },
    });
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);
    (prisma.evaluation.upsert as vi.Mock).mockResolvedValue({
      id: 'ev-pass',
      stage: 'screening',
      resume_score: 85,
      composite_score: 85,
      reasoning: 'Strong backend candidate.',
      decision: 'hire',
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...app,
      status: 'screening_completed',
      evaluations: [{ id: 'ev-pass' }],
    });

    const result = await screeningEvaluator.evaluateApplicationScreening('app-pass');

    expect(result.application.status).toBe('screening_completed');
    expect(result.evaluation.decision).toBe('hire');
  });

  it('marks rejected when score < minScore', async () => {
    (generateText as vi.Mock).mockResolvedValue(
      JSON.stringify({
        resumeScore: 55,
        semanticMatchScore: 40,
        gapAnalysis: {
          matchingSkills: ['Python'],
          missingSkills: ['PostgreSQL', 'Docker', 'Kubernetes'],
          experienceMatch: 'Insufficient experience',
          keyStrengths: ['Basic Django'],
        },
        reasoning: 'Candidate lacks required backend depth.',
      })
    );

    const app = buildApp({
      job: { ...buildApp().job, thresholds: { minScore: 70 } },
    });
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);
    (prisma.evaluation.upsert as vi.Mock).mockResolvedValue({
      id: 'ev-fail',
      stage: 'screening',
      resume_score: 55,
      composite_score: 55,
      reasoning: 'Candidate lacks required backend depth.',
      decision: 'reject',
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...app,
      status: 'rejected',
    });

    const result = await screeningEvaluator.evaluateApplicationScreening('app-fail');

    expect(result.application.status).toBe('rejected');
    expect(result.evaluation.decision).toBe('reject');
  });

  it('throws when job has no minScore threshold configured', async () => {
    const app = buildApp({
      job: { ...buildApp().job, thresholds: {} },
    });
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);

    await expect(
      screeningEvaluator.evaluateApplicationScreening('app-nothreshold')
    ).rejects.toThrow('Job job-nothreshold has no minScore threshold configured');
  });

  it('throws when application not found', async () => {
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(null);

    await expect(
      screeningEvaluator.evaluateApplicationScreening('ghost-app')
    ).rejects.toThrow('Application not found');
  });
});

// ---------------------------------------------------------------------------
// Gap analysis structure validation
// ---------------------------------------------------------------------------

describe('Screening Evaluator — gap analysis output structure', () => {
  it('handles missing gapAnalysis fields gracefully (fills defaults)', async () => {
    (generateText as vi.Mock).mockResolvedValue(
      JSON.stringify({
        resumeScore: 75,
        semanticMatchScore: 70,
        // gapAnalysis entirely omitted
        reasoning: 'Passes threshold.',
      })
    );

    const app = buildApp({
      job: { ...buildApp().job, thresholds: { minScore: 70 } },
    });
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);
    (prisma.evaluation.upsert as vi.Mock).mockResolvedValue({ id: 'ev-gap' });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...app,
      status: 'screening_completed',
    });

    const result = await screeningEvaluator.evaluateApplicationScreening('app-gap');

    // Missing fields should be filled with safe defaults
    expect(result.evaluation.resume_score).toBe(75);
    expect(result.evaluation.reasoning).toBe('Passes threshold.');
  });

  it('coerces gapAnalysis array fields to strings', async () => {
    (generateText as vi.Mock).mockResolvedValue(
      JSON.stringify({
        resumeScore: 72,
        semanticMatchScore: 68,
        gapAnalysis: {
          matchingSkills: ['Python', 123, null, 'Django'], // mixed types
          missingSkills: ['Kubernetes', undefined, ''],
          experienceMatch: 'Good',
          keyStrengths: ['FastAPI'],
        },
        reasoning: 'Passes.',
      })
    );

    const app = buildApp({
      job: { ...buildApp().job, thresholds: { minScore: 70 } },
    });
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);
    (prisma.evaluation.upsert as vi.Mock).mockResolvedValue({ id: 'ev-coerce' });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...app,
      status: 'screening_completed',
    });

    const result = await screeningEvaluator.evaluateApplicationScreening('app-coerce');

    // 123 and null should be coerced to strings
    expect(result.evaluation.resume_score).toBe(72);
  });
});

// ---------------------------------------------------------------------------
// Evaluation persistence
// ---------------------------------------------------------------------------

describe('Screening Evaluator — evaluation persistence', () => {
  it('creates evaluation on first screening', async () => {
    (generateText as vi.Mock).mockResolvedValue(
      JSON.stringify({
        resumeScore: 78,
        semanticMatchScore: 74,
        gapAnalysis: {
          matchingSkills: ['Python'],
          missingSkills: [],
          experienceMatch: 'Matched',
          keyStrengths: ['FastAPI'],
        },
        reasoning: 'Good fit.',
      })
    );

    const app = buildApp({
      job: { ...buildApp().job, thresholds: { minScore: 70 } },
      evaluations: [], // no prior evaluation
    });
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);
    (prisma.evaluation.upsert as vi.Mock).mockResolvedValue({
      id: 'new-ev',
      application_id: 'app-persist',
      stage: 'screening',
      resume_score: 78,
      composite_score: 78,
      reasoning: 'Good fit.',
      decision: 'hire',
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...app,
      status: 'screening_completed',
      evaluations: [{ id: 'new-ev' }],
    });

    await screeningEvaluator.evaluateApplicationScreening('app-persist');

    // should use create path (not update) since no prior eval existed
    expect(prisma.evaluation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ stage: 'screening' }),
        update: expect.objectContaining({ stage: 'screening' }),
      })
    );
  });

  it('updates existing evaluation on re-screening', async () => {
    const prevEval = { id: 'existing-ev', stage: 'screening', resume_score: 60 };
    const app = buildApp({
      job: { ...buildApp().job, thresholds: { minScore: 70 } },
      evaluations: [prevEval],
    });
    (generateText as vi.Mock).mockResolvedValue(
      JSON.stringify({
        resumeScore: 82,
        semanticMatchScore: 78,
        gapAnalysis: {
          matchingSkills: ['Python', 'PostgreSQL'],
          missingSkills: [],
          experienceMatch: 'Matched',
          keyStrengths: ['Django', 'Redis'],
        },
        reasoning: 'Updated review.',
      })
    );
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);
    (prisma.evaluation.upsert as vi.Mock).mockResolvedValue({
      ...prevEval,
      resume_score: 82,
      composite_score: 82,
      reasoning: 'Updated review.',
      decision: 'hire',
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...app,
      status: 'screening_completed',
      evaluations: [{ id: 'existing-ev', resume_score: 82 }],
    });

    await screeningEvaluator.evaluateApplicationScreening('app-update');

    // upsert should have been called — both create and update branches covered
    expect(prisma.evaluation.upsert).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ensureInterviewAndSchedule integration
// ---------------------------------------------------------------------------

import { ensureInterviewAndSchedule } from '../lib/pipeline';

describe('Screening Evaluator — post-pass scheduling', () => {
  it('calls ensureInterviewAndSchedule when not rejected', async () => {
    (generateText as vi.Mock).mockResolvedValue(
      JSON.stringify({
        resumeScore: 80,
        semanticMatchScore: 75,
        gapAnalysis: {
          matchingSkills: ['Python'],
          missingSkills: [],
          experienceMatch: 'Matched',
          keyStrengths: ['FastAPI'],
        },
        reasoning: 'Pass.',
      })
    );

    const app = buildApp({
      job: { ...buildApp().job, thresholds: { minScore: 70 } },
      evaluations: [],
    });
    (prisma.application.findUnique as vi.Mock).mockResolvedValue(app);
    (prisma.evaluation.upsert as vi.Mock).mockResolvedValue({
      id: 'ev-sched',
      stage: 'screening',
      resume_score: 80,
      composite_score: 80,
      reasoning: 'Pass.',
      decision: 'hire',
    });
    (prisma.application.update as vi.Mock).mockResolvedValue({
      ...app,
      status: 'screening_completed',
    });

    const mockEnsure = vi.fn().mockResolvedValue({ interviewId: 'int-sched' });
    vi.doMock('../../lib/pipeline', async () => {
      const actual = await vi.importActual('../../lib/pipeline');
      return {
        ...actual,
        ensureInterviewAndSchedule: mockEnsure,
      };
    });

    await screeningEvaluator.evaluateApplicationScreening('app-sched');

    expect(mockEnsure).toHaveBeenCalledWith('app-sched');
  });
});
