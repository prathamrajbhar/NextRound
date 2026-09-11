import { Request, Response, NextFunction } from 'express';
import { prisma } from '@nextround/database';
import { enqueueDecision } from '../../lib/queues/decision.queue';
import { HrResultBodySchema } from '../../validators/interview.schemas';
import { computeCompositeScore } from './interviews.helpers';

export async function saveHrResult(req: Request, res: Response, next: NextFunction) {
  try {
    const applicationId = String(req.params['applicationId']);
    const orgId = req.user?.orgId;

    if (!orgId) {
      return res
        .status(403)
        .json({ success: false, error: 'HR user must belong to an organization' });
    }

    const body = HrResultBodySchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.flatten() });
    }

    const { decision, notes } = body.data;

    const application = await prisma.application.findFirst({
      where: { id: applicationId, job: { org_id: orgId } },
      include: { job: true },
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found in organization' });
    }

    const hrRoundStatus = decision === 'pass' ? ('passed' as const) : ('failed' as const);
    const nextAppStatus = decision === 'pass' ? ('decided' as const) : ('rejected' as const);

    const [updatedApp, evaluation] = await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: {
          hr_round_status: hrRoundStatus,
          hr_round_completed_at: new Date(),
          status: nextAppStatus,
        },
      }),
      prisma.evaluation.upsert({
        where: { application_id: applicationId },
        create: {
          application_id: applicationId,
          stage: 'hr_round',
          decision: decision === 'pass' ? 'hire' : 'reject',
          reasoning: notes ?? `HR Video Round completed with decision: ${decision}`,
        },
        update: {
          stage: 'hr_round',
          decision: decision === 'pass' ? 'hire' : 'reject',
          reasoning: notes ?? `HR Video Round completed with decision: ${decision}`,
        },
      }),
    ]);

    if (decision === 'pass') {
      const compositeScore = computeCompositeScore(evaluation);
      const confidence = typeof evaluation.confidence === 'number' ? evaluation.confidence : 0.95;

      await enqueueDecision(
        applicationId,
        evaluation.id,
        compositeScore ?? undefined,
        confidence,
        { hr_notes: notes },
      );
    }

    return res.json({
      success: true,
      data: {
        application: updatedApp,
        message: `HR Video Round decision saved as ${decision}.`,
      },
    });
  } catch (error) {
    return next(error);
  }
}
