import { prisma } from '../lib/prisma';
import { enqueueScreening } from '../lib/queues/screening.queue';
import { logger } from '../lib/logger';
import { emailService } from './email.service';
import { notFound, forbidden, badRequest } from '../lib/http-errors';
import type { AppUserCtx } from './application-scheduling.service';

export async function candidateOwnsApplication(applicationId: string, userId: string): Promise<boolean> {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, candidate: { user_id: userId } },
    select: { id: true },
  });
  return Boolean(application);
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
      .catch((err) => logger.child('Applications').error(`Failed to send confirmation email to ${user.email}:`, err));
  }

  try {
    await enqueueScreening(application.id, {
      candidateId: profile.id,
      jobId: application.job_id,
      resumeUrl: profile.resume_url,
      timestamp: new Date().toISOString(),
    });
    logger.child('Applications').info(`Application ${application.id} accepted; screening job enqueued for job ${application.job_id}`);
  } catch (queueErr) {
    logger.child('Applications').error(`Failed to enqueue screening job for application ${application.id}:`, queueErr);
  }

  return { application };
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
