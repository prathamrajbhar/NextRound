import { prisma, Prisma } from '@nextround/database';
import { emailService } from '../email/email.service';
import { enqueueEvaluation } from '../../lib/queues/evaluation.queue';
import { logger } from '../../lib/logger';
import { notFound } from '../../lib/http-errors';

export async function recordInterviewResult(interviewId: string, body: Record<string, unknown>) {
  const id = interviewId;
  const { transcript, audio_url, interview_score, scores, reasoning, feedback } = body;

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { application: true },
  });

  if (!interview) {
    throw notFound('Interview not found');
  }

  const updatedInterview = await prisma.interview.update({
    where: { id },
    data: {
      status: 'completed',
      ...(transcript ? { transcript: transcript as Prisma.InputJsonValue } : {}),
      ...(audio_url ? { audio_url: audio_url as string } : {}),
    },
  });

  const scoresObj = scores && typeof scores === 'object' ? (scores as Record<string, unknown>) : undefined;
  const scoreNum =
    typeof interview_score === 'number'
      ? interview_score
      : typeof scoresObj?.composite === 'number'
      ? scoresObj.composite
      : null;

  const reasonText = (reasoning as string) || (feedback as string) || (scoreNum != null
    ? `Voice interview evaluation completed. Score: ${scoreNum}%`
    : 'Voice interview evaluation completed.');
  const decisionText = scoreNum != null ? (scoreNum >= 70 ? 'hire' : 'reject') : null;

  const evaluation = await prisma.evaluation.upsert({
    where: { application_id: interview.application_id },
    create: {
      application_id: interview.application_id,
      stage: 'interview',
      interview_score: scoreNum,
      composite_score: scoreNum,
      reasoning: reasonText,
      decision: decisionText,
    },
    update: {
      stage: 'interview',
      interview_score: scoreNum,
      composite_score: scoreNum,
      reasoning: reasonText,
      decision: decisionText,
    },
  });

  if (scoreNum != null) {
    await prisma.application.update({
      where: { id: interview.application_id },
      data: {
        status: scoreNum >= 70 ? 'hr_round' : 'rejected',
        hr_round_status: scoreNum >= 70 ? 'pending' : undefined,
      },
    });
  }

  if (scoreNum != null && scoreNum >= 70) {
    await enqueueEvaluation(
      interview.application_id,
      'final_evaluation',
      {
        interviewId: id,
        screening_score:
          typeof evaluation.resume_score === 'number' ? evaluation.resume_score : null,
        aptitude_score:
          typeof evaluation.aptitude_score === 'number' ? evaluation.aptitude_score : null,
        coding_score:
          typeof evaluation.coding_score === 'number' ? evaluation.coding_score : null,
        interview_score: scoreNum,
        proctor_flags: (body.proctor_flags as unknown[]) || [],
        proctor_telemetry: body.proctor_telemetry || {},
      }
    ).catch((error) =>
      logger.child('Internal').error(`Failed to enqueue evaluator for application ${interview.application_id}:`, error)
    );
  }

  return { interview: updatedInterview, evaluation };
}

export async function confirmInterviewSlot(interviewId: string, body: Record<string, unknown>) {
  const id = interviewId;
  const { scheduled_at } = body;

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          job: true,
          candidate: { include: { user: true } },
        },
      },
    },
  });

  if (!interview) {
    throw notFound('Interview not found');
  }

  const scheduledDate = scheduled_at ? new Date(scheduled_at as string) : new Date();

  const updatedInterview = await prisma.interview.update({
    where: { id },
    data: {
      scheduled_at: scheduledDate,
      status: 'scheduled',
    },
  });

  await prisma.application.update({
    where: { id: interview.application_id },
    data: {
      status: 'interview_scheduled',
      hr_round_status: 'scheduled',
      hr_round_scheduled_at: scheduledDate,
    },
  });

  const candidateEmail = interview.application.candidate.user?.email;
  if (candidateEmail) {
    const candidateName = candidateEmail.split('@')[0];
    const formattedDate = scheduledDate.toUTCString();
    emailService
      .sendInterviewConfirmation(
        candidateEmail,
        candidateName,
        interview.application.job.title,
        formattedDate,
        interview.application_id
      )
      .catch((error) =>
        logger.child('Internal').error(`Failed to send interview confirmation email for interview ${id}:`, error)
      );
  }

  return { interview: updatedInterview };
}

export async function recordScheduleSlots(interviewId: string, body: Record<string, unknown>) {
  const id = interviewId;
  const { slots, formatted_email } = body;

  const interview = await prisma.interview.findUnique({ where: { id } });
  if (!interview) {
    throw notFound('Interview not found');
  }

  const updatedInterview = await prisma.interview.update({
    where: { id },
    data: {
      status: 'scheduled',
    },
  });

  await prisma.agentLog.create({
    data: {
      job_id: null,
      agent_name: 'scheduler_agent',
      action: 'slots_generated',
      input: { interviewId: id } as Prisma.InputJsonValue,
      output: { slots, formatted_email } as Prisma.InputJsonValue,
      status: 'completed',
    },
  });

  return { interview: updatedInterview, slots, formatted_email };
}
