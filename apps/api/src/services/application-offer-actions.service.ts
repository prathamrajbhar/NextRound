import { prisma } from '../lib/prisma';
import { emailService } from './email.service';
import { logger } from '../lib/logger';
import { notFound, forbidden, badRequest } from '../lib/http-errors';
import type { AppUserCtx } from './application-scheduling.service';

async function checkCandidateOwnsApp(applicationId: string, userId: string): Promise<boolean> {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, candidate: { user_id: userId } },
    select: { id: true },
  });
  return Boolean(application);
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
    user?.role === 'candidate' && (await checkCandidateOwnsApp(offer.application_id, user.userId));
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

  const updatedApp = await prisma.application.update({
    where: { id: offer.application_id },
    data: { status: 'accepted' },
    include: {
      job: { include: { organization: { include: { users: true } } } },
      candidate: { include: { user: true } },
    },
  });

  if (updatedApp.candidate?.user?.email) {
    const hrEmails = updatedApp.job.organization.users
      .filter((u) => u.role === 'hr')
      .map((u) => u.email);
    if (hrEmails.length > 0) {
      const candidateEmail = updatedApp.candidate.user.email;
      const candidateName = candidateEmail.split('@')[0];
      emailService
        .sendOfferResponseAlert(
          hrEmails,
          candidateName,
          candidateEmail,
          updatedApp.job.title,
          'accepted',
          updatedApp.id
        )
        .catch((err) =>
          logger.child('Applications').error(`Failed to dispatch offer acceptance alert for ${updatedApp.id}:`, err)
        );
    }
  }

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
    user?.role === 'candidate' && (await checkCandidateOwnsApp(offer.application_id, user.userId));
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

  const updatedApp = await prisma.application.update({
    where: { id: offer.application_id },
    data: { status: 'rejected' },
    include: {
      job: { include: { organization: { include: { users: true } } } },
      candidate: { include: { user: true } },
    },
  });

  if (updatedApp.candidate?.user?.email) {
    const hrEmails = updatedApp.job.organization.users
      .filter((u) => u.role === 'hr')
      .map((u) => u.email);
    if (hrEmails.length > 0) {
      const candidateEmail = updatedApp.candidate.user.email;
      const candidateName = candidateEmail.split('@')[0];
      emailService
        .sendOfferResponseAlert(
          hrEmails,
          candidateName,
          candidateEmail,
          updatedApp.job.title,
          'declined',
          updatedApp.id,
          reason
        )
        .catch((err) =>
          logger.child('Applications').error(`Failed to dispatch offer decline alert for ${updatedApp.id}:`, err)
        );
    }
  }

  return { offer: updatedOffer, status: 'declined' };
}
