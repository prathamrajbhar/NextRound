import { prisma } from '../lib/prisma';
import type { Rec } from '../lib/serializers';
import { enqueueScreening } from '../lib/queues/screening.queue';
import { enqueueScheduling } from '../lib/queues/scheduling.queue';
import { enqueueAssessment } from '../lib/queues/assessment.queue';
import { emailService } from './email.service';
import { advanceAssessmentStage } from '../lib/pipeline';
import { evaluateApplicationScreening } from './screening-evaluator.service';
import {
  selectAptitudeQuestions,
  selectCodingProblem,
  toPublicAptitudeQuestions,
  buildAptitudeDistribution,
} from './question-bank.service';
import { executeCodingSubmission } from './coding-executor.service';
import { notFound, forbidden, badRequest } from '../lib/http-errors';










export interface AppUserCtx {
  userId: string;
  role: string;
  orgId?: string | null;
  email?: string | null;
}


export async function candidateOwnsApplication(applicationId: string, userId: string): Promise<boolean> {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, candidate: { user_id: userId } },
    select: { id: true },
  });
  return Boolean(app);
}






export async function applyToJob(user: AppUserCtx, body: { jobId: string; resumeUrl?: string | null }) {
  const { jobId, resumeUrl } = body;

  
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

  
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job || (job.status !== 'published' && job.status !== 'active')) {
    throw badRequest('Job is not open for applications');
  }

  
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

  
  if (user.email) {
    const candidateName = user.email.split('@')[0];
    emailService
      .sendApplicationReceived(user.email, candidateName, application.job.title)
      .catch((err) => console.error('Failed to send confirmation email:', err));
  }

  
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
      assessments: true,
      offer: true,
    },
    orderBy: { applied_at: 'desc' },
  });
}


export async function listOrgApplications(orgId: string, jobId?: string) {
  if (jobId) {
    
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
      assessments: true,
      offer: true,
    },
    orderBy: { applied_at: 'desc' },
  });
}


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

  
  if (user.role === 'hr') {
    if (!user.orgId || application.job.org_id !== user.orgId) {
      throw forbidden('Forbidden: Access denied to application');
    }
  } else if (user.role === 'candidate') {
    if (application.candidate.user_id !== user.userId) {
      throw forbidden('Forbidden: Access denied to application');
    }
  }

  
  
  
  
  
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

  
  
  if (application.status === 'screening_completed' || application.status === 'assessment') {
    const nextStatus = await advanceAssessmentStage(application.id);
    if (nextStatus) {
      application.status = nextStatus as any;
    }
  }

  return { application, scheduledSlots };
}






export async function runScreening(appId: string, user: AppUserCtx) {
  const application = await prisma.application.findUnique({
    where: { id: appId },
    include: { job: true, candidate: true },
  });

  if (!application) {
    throw notFound('Application not found');
  }

  
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

  
  const updatedApp = await prisma.application.update({
    where: { id: appId },
    data: {
      status: 'interview_scheduled',
      hr_round_status: 'scheduled',
      hr_round_scheduled_at: scheduledTime,
    },
  });

  
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






function getAppForCandidate(appId: string, userId: string) {
  return prisma.application.findUnique({
    where: { id: appId },
    include: { candidate: true, job: true },
  });
}


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

  
  const assessmentConfig = (app.job?.assessmentConfig as any) || {};
  const mcqDistribution  = assessmentConfig.mcqDistribution as Record<string, number> | undefined;
  const totalCount = mcqDistribution
    ? Object.values(mcqDistribution).reduce((s, v) => s + Number(v), 0)
    : Math.max(1, Math.min(100, Number(assessmentConfig.mcqCount) || 20));

  const distribution = buildAptitudeDistribution(totalCount, mcqDistribution);
  const allQuestions = await selectAptitudeQuestions({ distribution });

  
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

  
  let assessment = await prisma.assessment.findFirst({
    where: { application_id: appId, test_type: 'aptitude' },
    orderBy: { created_at: 'desc' },
  });

  let allQuestions: any[] = [];

  
  
  
  const isCompleted = assessment?.status === 'completed';
  const storedCount = Array.isArray(assessment?.questions) ? (assessment!.questions as any[]).length : 0;
  const countMatchesConfig = storedCount === totalCount;

  if (isCompleted && countMatchesConfig && storedCount > 0) {
    allQuestions = assessment!.questions as any[];
  } else {
    const distribution = buildAptitudeDistribution(totalCount, mcqDistribution);
    const selected = await selectAptitudeQuestions({ distribution });
    allQuestions = selected;

    if (assessment) {
      assessment = await prisma.assessment.update({
        where: { id: assessment.id },
        data: { questions: allQuestions as any, total_question_count: allQuestions.length, status: 'pending', responses: [] },
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

  
  const sanitizedQuestions = allQuestions.map((q: any) => ({
    id: q.id,
    category: q.category,
    question: q.question || q.text,
    text: q.question || q.text,
    options: q.options || [],
    difficulty: q.difficulty || 'medium',
    correctIndex: typeof q.correct_index === 'number' ? q.correct_index : q.correctIndex,
  }));

  return {
    assessmentId: assessment?.id,
    questions: sanitizedQuestions,
    mcqDistribution: mcqDistribution || {
      'Quantitative Aptitude': 5,
      'Logical Reasoning': 5,
      'Verbal Ability': 5,
      'Data Interpretation': 5,
    },
  };
}


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
    
    if (!answerMap.has(q.id)) continue;
    totalScored++;
    if (answerMap.get(q.id) === correctIdx) correctCount++;
  }
  const computedScore = totalScored > 0 ? Math.round((correctCount / totalScored) * 100) : null;

  
  await enqueueAssessment(appId, (answers as any[]) || [], { totalTimeSeconds, tabSwitchCount });

  
  
  return {
    score: computedScore,
    correctAnswers: correctCount,
    totalQuestions: totalScored,
    message: 'Aptitude assessment submitted successfully. Processing score...',
  };
}






export async function getCodingAssessment(appId: string, userId: string) {
  const app = await getAppForCandidate(appId, userId);
  if (!app || app.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  
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

  
  const sanitizedProblem = {
    ...problem,
    testCases: (problem.testCases || []).filter((tc: any) => !tc.hidden),
  };

  return { problem: sanitizedProblem };
}


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

  
  await prisma.assessment.update({
    where: { id: assessment.id },
    data: {
      status: 'completed',
      score: execSummary.passRate,
    },
  });

  
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


export async function getCodingSubmission(submissionId: string) {
  const submission = await prisma.codingSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw notFound('Submission not found');
  }

  return { submission };
}






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

  
  return { message: 'Reschedule request submitted. AI Scheduler is negotiating new slots...' };
}






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

  
  if (user.role === 'candidate' && application.candidate.user_id !== user.userId) {
    throw forbidden('Forbidden: Access denied');
  }
  if (user.role === 'hr' && application.job.org_id !== user.orgId) {
    throw forbidden('Forbidden: Access denied');
  }

  return { application, offer: application.offer };
}





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

  
  const isOwner =
    user?.role === 'candidate' && (await candidateOwnsApplication(offer.application_id, user.userId));
  const tokenValid =
    typeof magic_link_token === 'string' &&
    magic_link_token.length > 0 &&
    offer.magic_link_token === magic_link_token;

  if (!isOwner && !tokenValid) {
    throw forbidden('Forbidden: offer ownership could not be verified');
  }

  
  const updatedOffer = await prisma.offer.update({
    where: { id: offer.id },
    data: {
      signature_svg,
      status: 'accepted',
    },
  });

  
  await prisma.application.update({
    where: { id: offer.application_id },
    data: { status: 'accepted' },
  });

  return { offer: updatedOffer, status: 'accepted' };
}





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

  
  const isOwner =
    user?.role === 'candidate' && (await candidateOwnsApplication(offer.application_id, user.userId));
  const tokenValid =
    typeof magic_link_token === 'string' &&
    magic_link_token.length > 0 &&
    offer.magic_link_token === magic_link_token;

  if (!isOwner && !tokenValid) {
    throw forbidden('Forbidden: offer ownership could not be verified');
  }

  
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
