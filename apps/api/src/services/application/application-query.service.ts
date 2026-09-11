import { prisma } from '../../lib/prisma';
import type { Rec } from '../../lib/serializers';
import { advanceAssessmentStage } from '../../lib/pipeline';
import { notFound, forbidden } from '../../lib/http-errors';
import type { AppUserCtx } from './application-scheduling.service';

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
      scheduledSlots = output.slots.filter((slotItem): slotItem is string => typeof slotItem === 'string');
    }
  }

  if (application.status === 'screening_completed' || application.status === 'assessment') {
    const nextStatus = await advanceAssessmentStage(application.id);
    if (nextStatus) {
      application.status = nextStatus;
    }
  }

  return { application, scheduledSlots };
}
