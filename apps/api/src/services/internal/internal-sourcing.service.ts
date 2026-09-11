import { prisma, Prisma } from '@nextround/database';
import type { ApplicationStatus, JobStatus } from '@nextround/database';
import { emailService } from '../email/email.service';
import { logger } from '../../lib/logger';
import { ensureInterviewAndSchedule, advanceAssessmentStage } from '../../lib/pipeline';
import { notFound } from '../../lib/http-errors';

export async function recordAiAssistResult(jobId: string, body: Record<string, unknown>) {
  const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
  if (!existingJob) {
    throw notFound('Job not found');
  }

  const { description, rubric, thresholds, status, skills } = body;

  return prisma.job.update({
    where: { id: jobId },
    data: {
      ...(description ? { description: description as string } : {}),
      ...(rubric ? { rubric: rubric as Prisma.InputJsonValue } : {}),
      ...(thresholds ? { thresholds: thresholds as Prisma.InputJsonValue } : {}),
      ...(status ? { status: status as JobStatus } : {}),
      ...(skills ? { skills: skills as string[] } : {}),
    },
  });
}

export async function recordSourcedCandidates(jobId: string, body: Record<string, unknown>) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw notFound('Job not found');
  }

  const { candidates } = body;

  const currentThresholds =
    job.thresholds && typeof job.thresholds === 'object' ? (job.thresholds as Record<string, unknown>) : {};
  const updatedThresholds = {
    ...currentThresholds,
    sourced_candidates: candidates || [],
    sourced_at: new Date().toISOString(),
  };

  return prisma.job.update({
    where: { id: jobId },
    data: {
      thresholds: updatedThresholds as Prisma.InputJsonValue,
    },
  });
}

export async function recordScreeningResult(applicationId: string, body: Record<string, unknown>) {
  const id = applicationId;
  const {
    status,
    resume_score,
    composite_score,
    gap_analysis,
    reasoning,
    rejection_feedback,
  } = body;

  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      candidate: {
        include: {
          user: true,
        },
      },
      job: true,
    },
  });

  if (!app) {
    throw notFound('Application not found');
  }

  const updatedApp = await prisma.application.update({
    where: { id },
    data: {
      status:
        (status as ApplicationStatus | undefined) ||
        (typeof resume_score === 'number' && resume_score >= 70
          ? 'screening_completed'
          : 'rejected'),
    },
  });

  const evaluation = await prisma.evaluation.upsert({
    where: { application_id: id },
    create: {
      application_id: id,
      stage: 'screening',
      resume_score: typeof resume_score === 'number' ? resume_score : null,
      composite_score:
        typeof composite_score === 'number'
          ? composite_score
          : typeof resume_score === 'number'
          ? resume_score
          : null,
      reasoning:
        (reasoning as string) || (gap_analysis ? JSON.stringify(gap_analysis) : 'Screening completed'),
      decision: updatedApp.status === 'rejected' ? 'reject' : 'hire',
    },
    update: {
      stage: 'screening',
      resume_score: typeof resume_score === 'number' ? resume_score : undefined,
      composite_score: typeof composite_score === 'number' ? composite_score : undefined,
      reasoning:
        (reasoning as string) || (gap_analysis ? JSON.stringify(gap_analysis) : undefined),
      decision: updatedApp.status === 'rejected' ? 'reject' : 'hire',
    },
  });

  if (updatedApp.status === 'rejected' && app.candidate.user.email) {
    const candidateName = app.candidate.user.email.split('@')[0];
    await emailService
      .sendRejectionEmail(
        app.candidate.user.email,
        candidateName,
        app.job.title,
        gap_analysis,
        rejection_feedback as string | undefined
      )
      .catch((error) => logger.child('Internal').error(`Failed to send rejection email for application ${id}:`, error));
  }

  if (updatedApp.status !== 'rejected') {
    await ensureInterviewAndSchedule(id).catch((error) =>
      logger.child('Internal').error(`Failed to create interview/schedule for application ${id}:`, error)
    );

    await advanceAssessmentStage(id).catch((error) =>
      logger.child('Internal').error(`advanceAssessmentStage failed during screening completion for ${id}:`, error)
    );
  }

  return { application: updatedApp, evaluation };
}
