import { prisma } from '../lib/prisma';
import { notFound, forbidden } from '../lib/http-errors';
import type { AppUserCtx } from './application-scheduling.service';

export * from './application-offer-actions.service';

export async function checkCandidateOwnsApp(applicationId: string, userId: string): Promise<boolean> {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, candidate: { user_id: userId } },
    select: { id: true },
  });
  return Boolean(application);
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
