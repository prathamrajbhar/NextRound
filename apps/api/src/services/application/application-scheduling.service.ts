import { prisma } from '../../lib/prisma';
import { enqueueScheduling } from '../../lib/queues/scheduling.queue';
import { notFound, forbidden } from '../../lib/http-errors';

export interface AppUserCtx {
  userId: string;
  role: string;
  orgId?: string | null;
  email?: string | null;
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
