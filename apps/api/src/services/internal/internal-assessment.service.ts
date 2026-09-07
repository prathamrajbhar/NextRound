import { prisma, Prisma } from '@nextround/database';
import type { ApplicationStatus } from '@nextround/database';
import { logger } from '../../lib/logger';
import { advanceAssessmentStage, PAST_ASSESSMENT } from '../../lib/pipeline';
import { notFound } from '../../lib/http-errors';

export async function recordAssessmentResult(applicationId: string, body: Record<string, unknown>) {
  const id = applicationId;
  const { score, category_scores, passed, feedback } = body;

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) {
    throw notFound('Application not found');
  }

  let updatedStatus: ApplicationStatus | null = null;
  if (passed) {
    updatedStatus =
      ((await advanceAssessmentStage(id)) as ApplicationStatus | null) ?? 'screening_completed';
  } else if (!PAST_ASSESSMENT.includes(app.status)) {
    updatedStatus = 'rejected';
  }

  const updatedApp = updatedStatus
    ? await prisma.application.update({ where: { id }, data: { status: updatedStatus } })
    : app;

  const evaluation = await prisma.evaluation.upsert({
    where: { application_id: id },
    create: {
      application_id: id,
      stage: 'assessment',
      aptitude_score: typeof score === 'number' ? score : null,
      reasoning: (feedback as string) || `Aptitude assessment completed. Score: ${score}%`,
      decision: passed ? 'hire' : 'reject',
    },
    update: {
      stage: 'assessment',
      aptitude_score: typeof score === 'number' ? score : undefined,
      reasoning: (feedback as string) || `Aptitude assessment completed. Score: ${score}%`,
      decision: passed ? 'hire' : 'reject',
    },
  });

  await prisma.assessment
    .updateMany({
      where: { application_id: id, test_type: 'aptitude' },
      data: {
        score: typeof score === 'number' ? score : null,
        category_breakdown: (category_scores as Prisma.InputJsonValue) || {},
        status: 'completed',
      },
    })
    .catch((error) => {
      logger.child('Internal').error(`Failed to update assessment ${id} with evaluation results:`, error);
      throw error;
    });

  if (passed) {
    await advanceAssessmentStage(id).catch((error) =>
      logger.child('Internal').error(`advanceAssessmentStage failed for application ${id}:`, error)
    );
  }

  return { application: updatedApp, evaluation };
}

export async function recordCodingResult(applicationId: string, body: Record<string, unknown>) {
  const id = applicationId;
  const {
    submissionId,
    score,
    pass_rate,
    complexity_analysis,
    passed,
    feedback,
  } = body;

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) {
    throw notFound('Application not found');
  }

  const complexityObj = complexity_analysis && typeof complexity_analysis === 'object'
    ? (complexity_analysis as Record<string, unknown>)
    : undefined;
  const timeComplexity = typeof complexityObj?.time_complexity === 'string' ? complexityObj.time_complexity : 'unknown';

  if (submissionId) {
    await prisma.codingSubmission
      .update({
        where: { id: submissionId as string },
        data: {
          status: passed ? 'passed' : 'failed',
          pass_rate:
            typeof pass_rate === 'number'
              ? pass_rate
              : passed
              ? 1.0
              : 0.0,
          complexity: timeComplexity,
          ai_feedback: (feedback as string) || 'Coding evaluation completed',
        },
      })
      .catch((error) => logger.child('Internal').warn(`Could not update coding submission for application ${id}:`, error));
  }

  let updatedStatus: ApplicationStatus | null = null;
  if (passed) {
    updatedStatus =
      ((await advanceAssessmentStage(id)) as ApplicationStatus | null) ?? 'screening_completed';
  } else if (!PAST_ASSESSMENT.includes(app.status)) {
    updatedStatus = 'rejected';
  }

  const updatedApp = updatedStatus
    ? await prisma.application.update({ where: { id }, data: { status: updatedStatus } })
    : app;

  const evaluation = await prisma.evaluation.upsert({
    where: { application_id: id },
    create: {
      application_id: id,
      stage: 'coding',
      coding_score: typeof score === 'number' ? score : null,
      reasoning:
        (feedback as string) ||
        `Coding evaluation completed. Complexity: ${timeComplexity}`,
      decision: passed ? 'hire' : 'reject',
    },
    update: {
      stage: 'coding',
      coding_score: typeof score === 'number' ? score : undefined,
      reasoning:
        (feedback as string) ||
        `Coding evaluation completed. Complexity: ${timeComplexity}`,
      decision: passed ? 'hire' : 'reject',
    },
  });

  if (passed) {
    await advanceAssessmentStage(id).catch((error) =>
      logger.child('Internal').error(`advanceAssessmentStage failed for application ${id}:`, error)
    );
  }

  return { application: updatedApp, evaluation };
}

export async function getAssessmentData(applicationId: string, testType: string) {
  const id = applicationId;
  const assessment = await prisma.assessment.findFirst({
    where: { application_id: id, test_type: testType as import('@nextround/database').AssessmentType },
    orderBy: { created_at: 'desc' },
  });

  let minScore: number | null = null;
  try {
    const app = await prisma.application.findUnique({
      where: { id },
      select: { job: { select: { thresholds: true, assessmentConfig: true } } },
    });
    const assessmentConfig = (app?.job?.assessmentConfig ?? {}) as { passingScore?: number };
    const thresholds = (app?.job?.thresholds ?? {}) as { minScore?: number };

    minScore =
      typeof assessmentConfig.passingScore === 'number'
        ? assessmentConfig.passingScore
        : typeof thresholds.minScore === 'number'
        ? thresholds.minScore
        : null;
  } catch {
    minScore = null;
  }

  return {
    assessmentId: assessment?.id || null,
    questions: assessment?.questions || null,
    responses: assessment?.responses || null,
    status: assessment?.status || null,
    minScore,
  };
}
