import { prisma } from '../../lib/prisma';
import { forbidden, notFound } from '../../lib/http-errors';

export async function reviewProctoringViolation(
  violationId: string,
  status: 'acknowledged' | 'false_positive' | 'escalated' | 'resolved',
  reviewReason: string,
  reviewerId: string,
  userOrgId: string | null
) {
  const violation = await prisma.proctoringViolation.findUnique({
    where: { id: violationId },
    include: {
      proctoring_session: {
        include: {
          application: {
            include: {
              job: { select: { org_id: true } },
            },
          },
        },
      },
    },
  });

  if (!violation) {
    throw notFound('Proctoring violation not found');
  }

  const violationOrgId = violation.proctoring_session.application?.job.org_id;
  if (!userOrgId || violationOrgId !== userOrgId) {
    throw forbidden('Access denied: Org isolation violation');
  }

  return prisma.proctoringViolation.update({
    where: { id: violationId },
    data: {
      status,
      review_reason: reviewReason,
      reviewer_id: reviewerId,
    },
  });
}
