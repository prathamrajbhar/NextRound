import { prisma } from '../lib/prisma';
import type { Rec } from '../lib/serializers';
import { enqueueScreening } from '../lib/queues/screening.queue';
import { enqueueScheduling } from '../lib/queues/scheduling.queue';
import { enqueueAssessment } from '../lib/queues/assessment.queue';
import { emailService } from './email.service';
import { evaluateApplicationScreening } from './screening-evaluator.service';
import {
  selectAptitudeQuestions,
  selectCodingProblem,
  toPublicAptitudeQuestions,
  buildAptitudeDistribution,
} from './question-bank.service';
import { executeCodingSubmission } from './coding-executor.service';
import { notFound, forbidden, badRequest } from '../lib/http-errors';

/**
 * Business logic for the client-facing applications API
 * (`/api/v1/applications/*`). Each function is HTTP-free: it performs the
 * apply flow, stage transitions, assessment generation/scoring, and offer
 * sign/decline, throwing `HttpError` (via `notFound`/`forbidden`/`badRequest`)
 * for the failure cases the route used to answer inline. The route layer owns
 * auth, serialization, and the response envelope.
 */

export interface AppUserCtx {
  userId: string;
  role: string;
  orgId?: string | null;
  email?: string | null;
}

/** Verify an application belongs to the authenticated candidate (via CandidateProfile). */
export async function candidateOwnsApplication(applicationId: string, userId: string): Promise<boolean> {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, candidate: { user_id: userId } },
    select: { id: true },
  });
  return Boolean(app);
}

// ---------------------------------------------------------------------------
// Apply flow & listing
// ---------------------------------------------------------------------------

/** POST / — candidate submits an application. */
export async function applyToJob(user: AppUserCtx, body: { jobId: string; resumeUrl?: string | null }) {
  const { jobId, resumeUrl } = body;

  // Find or create candidate profile
  let profile = await prisma.candidateProfile.findUnique({
    where: { user_id: user.userId },
  });

  if (!profile) {
    profile = await prisma.candidateProfile.create({
      data: {
        user_id: user.userId,
        resume_url: resumeUrl || null,
      },
    });
  } else if (resumeUrl) {
    profile = await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { resume_url: resumeUrl },
    });
  }

  // Check job exists and is active/published
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job || (job.status !== 'published' && job.status !== 'active')) {
    throw badRequest('Job is not open for applications');
  }

  // Prevent duplicate application
  const existingApp = await prisma.application.findUnique({
    where: {
      candidate_id_job_id: {
        candidate_id: profile.id,
        job_id: jobId,
      },
    },
  });

  if (existingApp) {
    throw badRequest('You have already applied for this job');
  }

  // Create Application
  const application = await prisma.application.create({
    data: {
      candidate_id: profile.id,
      job_id: jobId,
      status: 'applied',
    },
    include: {
      job: {
        select: { id: true, title: true, org_id: true },
      },
    },
  });

  // Send confirmation email asynchronously
  if (user.email) {
    const candidateName = user.email.split('@')[0];
    emailService
      .sendApplicationReceived(user.email, candidateName, application.job.title)
      .catch((err) => console.error('Failed to send confirmation email:', err));
  }

  // Enqueue screening agent processing
  try {
    await enqueueScreening(application.id, {
      candidateId: profile.id,
      jobId: application.job_id,
      resumeUrl: profile.resume_url,
      timestamp: new Date().toISOString(),
    });
  } catch (queueErr) {
    console.error('Failed to enqueue screening job:', queueErr);
  }

  return { application };
}

/** GET /my — candidate's own applications; null when no profile exists yet. */
export async function listCandidateApplications(userId: string): Promise<Rec[] | null> {
  const profile = await prisma.candidateProfile.findUnique({
    where: { user_id: userId },
  });

  if (!profile) {
    return null;
  }

  return prisma.application.findMany({
    where: { candidate_id: profile.id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          status: true,
          organization: {
            select: { id: true, name: true, logo_url: true },
          },
        },
      },
      candidate: {
        include: {
          user: { select: { email: true } },
        },
      },
      evaluations: true,
      interview: true,
      offer: true,
    },
    orderBy: { applied_at: 'desc' },
  });
}

/** GET / — HR list applications for an org, optionally filtered by job. */
export async function listOrgApplications(orgId: string, jobId?: string) {
  if (jobId) {
    // Validate the job belongs to the HR org
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.org_id !== orgId) {
      throw forbidden('Forbidden: Access denied to job applications');
    }
  }

  return prisma.application.findMany({
    where: {
      ...(jobId ? { job_id: jobId } : {}),
      job: { org_id: orgId },
    },
    include: {
      job: {
        include: {
          organization: { select: { id: true, name: true, logo_url: true } },
        },
      },
      candidate: {
        include: {
          user: { select: { email: true } },
        },
      },
      evaluations: true,
      interview: true,
      offer: true,
    },
    orderBy: { applied_at: 'desc' },
  });
}

/** GET /:id — single application with the Scheduler Agent's real slot proposals. */
export async function getApplication(appId: string, user: AppUserCtx) {
  const application = await prisma.application.findUnique({
    where: { id: appId },
    include: {
      job: {
        include: {
          organization: { select: { id: true, name: true, logo_url: true } },
        },
      },
      candidate: {
        include: {
          user: { select: { id: true, email: true } },
        },
      },
      evaluations: true,
      interview: true,
      assessments: true,
      coding_submissions: true,
      offer: true,
    },
  });

  if (!application) {
    throw notFound('Application not found');
  }

  // Multi-tenant RBAC check
  if (user.role === 'hr') {
    if (!user.orgId || application.job.org_id !== user.orgId) {
      throw forbidden('Forbidden: Access denied to application');
    }
  } else if (user.role === 'candidate') {
    if (application.candidate.user_id !== user.userId) {
      throw forbidden('Forbidden: Access denied to application');
    }
  }

  // Expose the Scheduler Agent's real slot proposals on the application
  // payload. Slots are persisted as a scheduler_agent AgentLog keyed by
  // interview id (internal POST /interviews/:id/schedule-slots). When no
  // slots have been generated the field is omitted so the client renders an
  // honest empty state instead of fabricated 'Tomorrow at 10:00 AM' times.
  let scheduledSlots: string[] = [];
  if (application.interview) {
    const slotLog = await prisma.agentLog.findFirst({
      where: {
        agent_name: 'scheduler_agent',
        action: 'slots_generated',
        input: { path: ['interviewId'], equals: application.interview.id },
      },
      orderBy: { created_at: 'desc' },
    });
    const output =
      slotLog?.output && typeof slotLog.output === 'object'
        ? (slotLog.output as Record<string, unknown>)
        : undefined;
    if (output && Array.isArray(output.slots)) {
      scheduledSlots = output.slots.filter((s): s is string => typeof s === 'string');
    }
  }

  return { application, scheduledSlots };
}

// ---------------------------------------------------------------------------
// Screening & stage transitions
// ---------------------------------------------------------------------------

/** POST /:id/run-screening — run or re-run AI screening evaluation. */
export async function runScreening(appId: string, user: AppUserCtx) {
  const application = await prisma.application.findUnique({
    where: { id: appId },
    include: { job: true, candidate: true },
  });

  if (!application) {
    throw notFound('Application not found');
  }

  // Authorization check
  if (user.role === 'hr') {
    if (application.job.org_id !== user.orgId) {
      throw forbidden('Forbidden: Access denied to application');
    }
  } else if (user.role === 'candidate') {
    if (application.candidate.user_id !== user.userId) {
      throw forbidden('Forbidden: Access denied to application');
    }
  }

  return evaluateApplicationScreening(appId);
}

/** PATCH /:id/status — HR override stage status. */
export async function overrideStatus(
  appId: string,
  orgId: string,
  body: { status: string; reasoning?: string | null }
) {
  const application = await prisma.application.findUnique({
    where: { id: appId },
    include: { job: true },
  });

  if (!application) {
    throw notFound('Application not found');
  }

  if (application.job.org_id !== orgId) {
    throw forbidden('Forbidden: Access denied to application');
  }

  const updatedApp = await prisma.application.update({
    where: { id: appId },
    data: {
      status: body.status as any,
    },
  });

  // Optionally record evaluation reasoning if provided
  if (body.reasoning) {
    await prisma.evaluation.upsert({
      where: { application_id: appId },
      create: {
        application_id: appId,
        stage: body.status,
        reasoning: body.reasoning,
      },
      update: {
        stage: body.status,
        reasoning: body.reasoning,
      },
    });
  }

  return { application: updatedApp };
}

const STAGE_TO_STATUS: Record<string, string> = {
  Sourced: 'applied',
  Screened: 'screening_completed',
  Assessment: 'assessment',
  Interview: 'interview_scheduled',
  'HR Round': 'hr_round',
  Panel: 'evaluation',
  Decision: 'decided',
};

const VALID_STATUSES = [
  'applied',
  'screening',
  'screening_completed',
  'assessment',
  'interview_scheduled',
  'interviewed',
  'evaluation',
  'hr_round',
  'decided',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
];

/** PATCH /:id — HR advance candidate stage (Kanban). Maps stage name to status. */
export async function advanceStage(
  appId: string,
  orgId: string,
  body: { stage?: string; status?: string }
) {
  const application = await prisma.application.findUnique({
    where: { id: appId },
    include: { job: true },
  });

  if (!application) {
    throw notFound('Application not found');
  }

  if (application.job.org_id !== orgId) {
    throw forbidden('Forbidden: Access denied to application');
  }

  const { stage, status } = body;

  let nextStatus: string;
  if (status && VALID_STATUSES.includes(status)) {
    nextStatus = status;
  } else if (stage) {
    nextStatus = STAGE_TO_STATUS[stage] || application.status;
  } else {
    throw badRequest('Provide a stage or status to advance the candidate');
  }

  const updatedApp = await prisma.application.update({
    where: { id: appId },
    data: { status: nextStatus as any },
  });

  return {
    application: {
      ...updatedApp,
      job: application.job,
    },
  };
}

/** POST /:id/schedule — schedule HR round / voice interview. */
export async function scheduleInterview(
  appId: string,
  user: AppUserCtx,
  body: { scheduledAt?: string | null }
) {
  const application = await prisma.application.findUnique({
    where: { id: appId },
    include: { job: true, candidate: true },
  });

  if (!application) {
    throw notFound('Application not found');
  }

  // RBAC check
  if (user.role === 'hr') {
    if (application.job.org_id !== user.orgId) {
      throw forbidden('Forbidden: Access denied');
    }
  } else if (user.role === 'candidate') {
    if (application.candidate.user_id !== user.userId) {
      throw forbidden('Forbidden: Access denied');
    }
  }

  const scheduledTime = body.scheduledAt ? new Date(body.scheduledAt) : new Date();

  // Update HR round scheduled info or Interview scheduled status
  const updatedApp = await prisma.application.update({
    where: { id: appId },
    data: {
      status: 'interview_scheduled',
      hr_round_status: 'scheduled',
      hr_round_scheduled_at: scheduledTime,
    },
  });

  // Upsert Interview record
  const interview = await prisma.interview.upsert({
    where: { application_id: appId },
    create: {
      application_id: appId,
      scheduled_at: scheduledTime,
      status: 'scheduled',
    },
    update: {
      scheduled_at: scheduledTime,
      status: 'scheduled',
    },
  });

  return { application: updatedApp, interview };
}

/** POST /:id/withdraw — candidate withdraws application. */
export async function withdrawApplication(appId: string, userId: string) {
  const application = await prisma.application.findUnique({
    where: { id: appId },
    include: { candidate: true },
  });

  if (!application) {
    throw notFound('Application not found');
  }

  if (application.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied to application');
  }

  const updatedApp = await prisma.application.update({
    where: { id: appId },
    data: { status: 'withdrawn' },
  });

  return { application: updatedApp, message: 'Application withdrawn successfully' };
}

// ---------------------------------------------------------------------------
// Aptitude assessment
// ---------------------------------------------------------------------------

/** Fetch an application with its candidate + job; callers enforce ownership. */
function getAppForCandidate(appId: string, userId: string) {
  return prisma.application.findUnique({
    where: { id: appId },
    include: { candidate: true, job: true },
  });
}

/** GET /:id/assessment/aptitude/chunk — progressive DB aptitude chunk. */
export async function getAptitudeChunk(
  appId: string,
  userId: string,
  opts: { chunkIndex: number; chunkSize: number }
) {
  const app = await getAppForCandidate(appId, userId);
  if (!app || app.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  const { chunkIndex, chunkSize } = opts;

  let assessment = await prisma.assessment.findFirst({
    where: { application_id: appId, test_type: 'aptitude' },
    orderBy: { created_at: 'desc' },
  });

  // If assessment already has questions stored, serve from there
  const existingQuestions: any[] = Array.isArray(assessment?.questions)
    ? (assessment!.questions as any[])
    : [];
  const startIndex = chunkIndex * chunkSize;
  const endIndex   = startIndex + chunkSize;

  if (existingQuestions.length >= endIndex) {
    const chunkQs = existingQuestions.slice(startIndex, endIndex).map((q: any) => ({
      id: q.id,
      category: q.category,
      question: q.question || q.text,
      text: q.question || q.text,
      options: q.options || [],
      difficulty: q.difficulty || 'medium',
    }));
    return { assessmentId: assessment?.id, chunkIndex, chunkSize, questions: chunkQs, hasMore: existingQuestions.length > endIndex };
  }

  // Select the full question set from DB if not yet stored
  const assessmentConfig = (app.job?.assessmentConfig as any) || {};
  const mcqDistribution  = assessmentConfig.mcqDistribution as Record<string, number> | undefined;
  const totalCount = mcqDistribution
    ? Object.values(mcqDistribution).reduce((s, v) => s + Number(v), 0)
    : Math.max(1, Math.min(100, Number(assessmentConfig.mcqCount) || 20));

  const distribution = buildAptitudeDistribution(totalCount, mcqDistribution);
  const allQuestions = await selectAptitudeQuestions({ distribution });

  // Persist all questions server-side (with correct_index for scoring later)
  if (assessment) {
    assessment = await prisma.assessment.update({
      where: { id: assessment.id },
      data: { questions: allQuestions as any, total_question_count: allQuestions.length, status: 'in_progress' },
    });
  } else {
    assessment = await prisma.assessment.create({
      data: {
        application_id: appId,
        test_type: 'aptitude',
        questions: allQuestions as any,
        total_question_count: allQuestions.length,
        status: 'in_progress',
      },
    });
  }

  const chunkQs = allQuestions.slice(startIndex, endIndex).map((q) => ({
    id: q.id,
    category: q.category,
    question: q.question,
    text: q.text,
    options: q.options,
    difficulty: q.difficulty,
  }));

  return {
    assessmentId: assessment.id,
    chunkIndex,
    chunkSize,
    questions: chunkQs,
    hasMore: allQuestions.length > endIndex,
  };
}

/** POST /:id/assessment/aptitude/chunk — submit current chunk & fetch next. */
export async function submitAptitudeChunk(
  appId: string,
  userId: string,
  body: { chunkIndex?: number; chunkSize?: number; answers?: unknown[] }
) {
  const app = await getAppForCandidate(appId, userId);
  if (!app || app.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  const { chunkIndex = 0, chunkSize = 3, answers = [] } = body;

  let assessment = await prisma.assessment.findFirst({
    where: { application_id: appId, test_type: 'aptitude' },
    orderBy: { created_at: 'desc' },
  });

  // Persist submitted answers
  if (assessment) {
    const existingResponses = Array.isArray(assessment.responses) ? (assessment.responses as any[]) : [];
    const mergedResponses = [...existingResponses, ...(Array.isArray(answers) ? answers : [])];
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { responses: mergedResponses, status: 'in_progress' },
    });
  }

  const nextChunkIndex = Number(chunkIndex) + 1;
  const existingQuestions: any[] = Array.isArray(assessment?.questions)
    ? (assessment!.questions as any[])
    : [];

  // Questions are already stored in the assessment from getAptitudeChunk.
  // Serve from cache — no further DB selection needed.
  const startOfNext = nextChunkIndex * Number(chunkSize);
  const endOfNext   = startOfNext + Number(chunkSize);
  const nextQs = existingQuestions.slice(startOfNext, endOfNext).map((q: any) => ({
    id: q.id,
    category: q.category,
    question: q.question || q.text,
    text: q.question || q.text,
    options: q.options || [],
    difficulty: q.difficulty || 'medium',
  }));

  return {
    currentChunkSubmitted: chunkIndex,
    nextChunkIndex,
    questions: nextQs,
    hasMore: true,
  };
}

/** GET /:id/assessment/aptitude — fetch aptitude questions from DB question bank. */
export async function getAptitudeAssessment(appId: string, userId: string) {
  const app = await getAppForCandidate(appId, userId);
  if (!app || app.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  const assessmentConfig = (app.job?.assessmentConfig as any) || {};
  const mcqDistribution  = assessmentConfig.mcqDistribution as Record<string, number> | undefined;
  const totalCount = mcqDistribution
    ? Object.values(mcqDistribution).reduce((s: number, v: unknown) => s + Number(v), 0)
    : Math.max(1, Math.min(100, Number(assessmentConfig.mcqCount) || 20));

  // Return existing assessment if it already has the right number of questions
  let assessment = await prisma.assessment.findFirst({
    where: { application_id: appId, test_type: 'aptitude' },
    orderBy: { created_at: 'desc' },
  });

  let allQuestions: any[] = [];

  // Only reuse stored questions if the assessment is already completed (submitted).
  // For pending/in_progress sessions always re-draw fresh random questions so
  // candidates never see the same set on repeated loads.
  const isCompleted = assessment?.status === 'completed';

  if (isCompleted && Array.isArray(assessment!.questions) && (assessment!.questions as any[]).length > 0) {
    allQuestions = assessment!.questions as any[];
  } else {
    const distribution = buildAptitudeDistribution(totalCount, mcqDistribution);
    const selected = await selectAptitudeQuestions({ distribution });
    allQuestions = selected;

    if (assessment) {
      assessment = await prisma.assessment.update({
        where: { id: assessment.id },
        data: { questions: allQuestions as any, total_question_count: allQuestions.length, status: 'pending' },
      });
    } else {
      assessment = await prisma.assessment.create({
        data: {
          application_id: appId,
          test_type: 'aptitude',
          questions: allQuestions as any,
          total_question_count: allQuestions.length,
          status: 'pending',
        },
      });
    }
  }

  // Strip correct_index before returning to client
  const sanitizedQuestions = allQuestions.map((q: any) => ({
    id: q.id,
    category: q.category,
    question: q.question || q.text,
    text: q.question || q.text,
    options: q.options || [],
    difficulty: q.difficulty || 'medium',
  }));

  return { assessmentId: assessment?.id, questions: sanitizedQuestions };
}

/** POST /:id/assessment/aptitude — submit aptitude answers. */
export async function submitAptitude(
  appId: string,
  userId: string,
  body: { answers?: unknown[]; totalTimeSeconds?: number; tabSwitchCount?: number }
) {
  const app = await getAppForCandidate(appId, userId);
  if (!app || app.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  const { answers, totalTimeSeconds, tabSwitchCount } = body;

  // Update responses in Assessment table
  await prisma.assessment
    .updateMany({
      where: { application_id: appId, test_type: 'aptitude' },
      data: {
        responses: (answers as any[]) || [],
        status: 'in_progress',
      },
    })
    .catch((err) => {
      console.error(`Failed to update assessment responses for application ${appId}:`, err);
    });

  // Score the submission server-side against the persisted questions (which
  // carry correctIndex) so the client gets a real result immediately instead
  // of a fabricated 0%. The async job still runs for the full pipeline.
  const storedAssessment = await prisma.assessment.findFirst({
    where: { application_id: appId, test_type: 'aptitude' },
    orderBy: { created_at: 'desc' },
  });
  const storedQuestions = Array.isArray(storedAssessment?.questions)
    ? (storedAssessment!.questions as Array<{ id?: string; correctIndex?: unknown; correct_index?: unknown }>)
    : [];
  const answersArr = Array.isArray(answers)
    ? (answers as Array<{ questionId?: string; selectedOption?: unknown }>)
    : [];
  const answerMap = new Map(answersArr.map((a) => [a.questionId, a.selectedOption]));
  let correctCount = 0;
  let totalScored = 0;
  for (const q of storedQuestions) {
    const correctIdx = q.correctIndex !== undefined ? q.correctIndex : q.correct_index;
    if (typeof correctIdx !== 'number') continue;
    totalScored++;
    if (answerMap.get(q.id) === correctIdx) correctCount++;
  }
  const computedScore = totalScored > 0 ? Math.round((correctCount / totalScored) * 100) : null;

  // Enqueue assessment scoring job in BullMQ
  await enqueueAssessment(appId, (answers as any[]) || [], { totalTimeSeconds, tabSwitchCount });

  // NOTE: the response keeps the legacy top-level score fields (not the data
  // envelope) because the web client reads res.score directly.
  return {
    score: computedScore,
    correctAnswers: correctCount,
    totalQuestions: totalScored,
    message: 'Aptitude assessment submitted successfully. Processing score...',
  };
}

// ---------------------------------------------------------------------------
// Coding assessment
// ---------------------------------------------------------------------------

/** GET /:id/assessment/coding — fetch coding problem from DB question bank. */
export async function getCodingAssessment(appId: string, userId: string) {
  const app = await getAppForCandidate(appId, userId);
  if (!app || app.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  // Return existing coding assessment if already assigned
  let assessment = await prisma.assessment.findFirst({
    where: { application_id: appId, test_type: 'coding' },
  });

  let problem: any;

  if (assessment) {
    problem = assessment.questions;
  } else {
    const jobConfig = (app.job?.thresholds as any) || {};
    const difficulty = jobConfig.difficulty as 'easy' | 'medium' | 'hard' | undefined;

    const selected = await selectCodingProblem({ difficulty });
    problem = selected;

    assessment = await prisma.assessment.create({
      data: {
        application_id: appId,
        test_type: 'coding',
        questions: problem as any,
        status: 'in_progress',
      },
    });
  }

  // Strip hidden test cases before sending to candidate
  const sanitizedProblem = {
    ...problem,
    testCases: (problem.testCases || []).filter((tc: any) => !tc.hidden),
  };

  return { problem: sanitizedProblem };
}

/** POST /:id/assessment/coding — submit candidate code. */
export async function submitCoding(
  appId: string,
  userId: string,
  body: { code?: string; language?: string }
) {
  const app = await getAppForCandidate(appId, userId);
  if (!app || app.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  const { code, language } = body;

  // Retrieve the persisted coding problem from the Assessment table
  const assessment = await prisma.assessment.findFirst({
    where: { application_id: appId, test_type: 'coding' },
  });

  if (!assessment) {
    throw notFound('Coding assessment not found. Please retrieve the problem first.');
  }

  const currentProblem = assessment.questions as any;
  const testCasesToRun = currentProblem.testCases || [];

  const execSummary = executeCodingSubmission(code || '', language || 'python', testCasesToRun);

  const submission = await prisma.codingSubmission.create({
    data: {
      application_id: appId,
      problem_id: currentProblem.id || null,
      code: code || '',
      language: language || 'python',
      status: execSummary.allPassed ? 'passed' : 'failed',
      test_results: JSON.parse(
        JSON.stringify({
          status: execSummary.allPassed ? 'passed' : 'failed',
          passRate: execSummary.passRate,
          results: execSummary.results,
          logs: execSummary.logs,
          ai_feedback: execSummary.allPassed
            ? 'All test cases passed cleanly!'
            : `${execSummary.passRate}% pass rate achieved.`,
        })
      ),
      pass_rate: execSummary.passRate,
      pass_rate_percent: execSummary.passRate,
      pass_rate_ratio: execSummary.passRateRatio,
    },
  });

  // Update assessment status to completed
  await prisma.assessment.update({
    where: { id: assessment.id },
    data: {
      status: 'completed',
      score: execSummary.passRate,
    },
  });

  // Update application evaluation score
  await prisma.evaluation.upsert({
    where: { application_id: appId },
    create: {
      application_id: appId,
      stage: 'assessment',
      coding_score: execSummary.passRate,
      reasoning: `Candidate achieved ${execSummary.passRate}% pass rate on coding assessment. Pending recruiter evaluation.`,
    },
    update: {
      coding_score: execSummary.passRate,
      reasoning: `Candidate achieved ${execSummary.passRate}% pass rate on coding assessment. Pending recruiter evaluation.`,
    },
  });

  return {
    submissionId: submission.id,
    status: submission.status,
    passRate: execSummary.passRate,
    results: execSummary.results,
  };
}

/** GET /:id/assessment/coding/:submissionId — poll submission status. */
export async function getCodingSubmission(submissionId: string) {
  const submission = await prisma.codingSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw notFound('Submission not found');
  }

  return { submission };
}

// ---------------------------------------------------------------------------
// Reschedule
// ---------------------------------------------------------------------------

/** POST /:id/reschedule — request interview reschedule. */
export async function requestReschedule(appId: string, userId: string) {
  const app = await prisma.application.findUnique({
    where: { id: appId },
    include: { candidate: { include: { user: true } }, job: true },
  });

  if (!app || app.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  await enqueueScheduling(appId, {
    action: 'reschedule',
    candidateEmail: app.candidate.user.email,
    jobTitle: app.job.title,
  });

  // NOTE: legacy top-level message shape (no data envelope) preserved as-is.
  return { message: 'Reschedule request submitted. AI Scheduler is negotiating new slots...' };
}

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

/** GET /offer/token/:token — fetch offer by magic link token. */
export async function getOfferByToken(token: string) {
  const offer = await prisma.offer.findFirst({
    where: { magic_link_token: token },
    include: {
      application: {
        include: {
          job: {
            include: {
              organization: { select: { name: true, logo_url: true } },
            },
          },
          candidate: {
            include: {
              user: { select: { email: true } },
            },
          },
        },
      },
    },
  });

  if (!offer) {
    throw notFound('Invalid or expired offer token');
  }

  return { offer };
}

/** GET /:id/offer — fetch application offer details. */
export async function getApplicationOffer(appId: string, user: AppUserCtx) {
  const application = await prisma.application.findUnique({
    where: { id: appId },
    include: {
      offer: true,
      candidate: { include: { user: { select: { email: true } } } },
      job: { include: { organization: { select: { name: true, logo_url: true } } } },
    },
  });

  if (!application || !application.offer) {
    throw notFound('No offer found for application');
  }

  // Check access permission
  if (user.role === 'candidate' && application.candidate.user_id !== user.userId) {
    throw forbidden('Forbidden: Access denied');
  }
  if (user.role === 'hr' && application.job.org_id !== user.orgId) {
    throw forbidden('Forbidden: Access denied');
  }

  return { application, offer: application.offer };
}

/**
 * POST /:id/offer/sign — digitally sign offer.
 * Auth: authenticated candidate owner OR a valid magic_link_token (from the emailed link).
 */
export async function signOffer(
  appId: string,
  body: { signature_svg?: string; magic_link_token?: string },
  user: AppUserCtx | null
) {
  const { signature_svg, magic_link_token } = body;

  if (!signature_svg) {
    throw badRequest('signature_svg is required');
  }

  let offer = await prisma.offer.findUnique({
    where: { application_id: appId },
  });

  if (!offer && magic_link_token) {
    offer = await prisma.offer.findFirst({
      where: { magic_link_token },
    });
  }

  if (!offer) {
    throw notFound('Offer not found for application');
  }

  // Authorization: only the owning candidate or a valid magic link token may sign.
  const isOwner =
    user?.role === 'candidate' && (await candidateOwnsApplication(offer.application_id, user.userId));
  const tokenValid =
    typeof magic_link_token === 'string' &&
    magic_link_token.length > 0 &&
    offer.magic_link_token === magic_link_token;

  if (!isOwner && !tokenValid) {
    throw forbidden('Forbidden: offer ownership could not be verified');
  }

  // Update offer status and save signature SVG vector
  const updatedOffer = await prisma.offer.update({
    where: { id: offer.id },
    data: {
      signature_svg,
      status: 'accepted',
    },
  });

  // Update application status to accepted
  await prisma.application.update({
    where: { id: offer.application_id },
    data: { status: 'accepted' },
  });

  return { offer: updatedOffer, status: 'accepted' };
}

/**
 * POST /:id/offer/decline — candidate declines offer.
 * Auth: authenticated candidate owner OR a valid magic_link_token (from the emailed link).
 */
export async function declineOffer(
  appId: string,
  body: { reason?: string; magic_link_token?: string },
  user: AppUserCtx | null
) {
  const { reason, magic_link_token } = body;

  let offer = await prisma.offer.findUnique({
    where: { application_id: appId },
  });

  if (!offer && magic_link_token) {
    offer = await prisma.offer.findFirst({
      where: { magic_link_token },
    });
  }

  if (!offer) {
    throw notFound('Offer not found for application');
  }

  // Authorization: only the owning candidate or a valid magic link token may decline.
  const isOwner =
    user?.role === 'candidate' && (await candidateOwnsApplication(offer.application_id, user.userId));
  const tokenValid =
    typeof magic_link_token === 'string' &&
    magic_link_token.length > 0 &&
    offer.magic_link_token === magic_link_token;

  if (!isOwner && !tokenValid) {
    throw forbidden('Forbidden: offer ownership could not be verified');
  }

  // Decline offer and update application to rejected
  const updatedOffer = await prisma.offer.update({
    where: { id: offer.id },
    data: {
      status: 'declined',
      offer_letter_content: reason
        ? `Declined reason: ${reason}\n${offer.offer_letter_content ?? ''}`
        : offer.offer_letter_content,
    },
  });

  await prisma.application.update({
    where: { id: offer.application_id },
    data: { status: 'rejected' },
  });

  return { offer: updatedOffer, status: 'declined' };
}
