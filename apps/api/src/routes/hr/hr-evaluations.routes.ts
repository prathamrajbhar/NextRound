import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope, rejectOrgIdParam } from '../../middleware/orgScope';
import { deriveSalary } from '../../lib/offer-terms';
import { upsertOffer } from '../../services/offer.service';
import { emailService } from '../../services/email.service';

export const hrEvaluationsRouter = Router();


hrEvaluationsRouter.use(rejectOrgIdParam);


hrEvaluationsRouter.patch(
  '/evaluations/:id/hr-override',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.orgId!;
      const evalId = req.params.id as string;
      const { decision, notes } = req.body; 

      if (!decision || !['hire', 'reject'].includes(decision)) {
        return res.status(400).json({ success: false, error: 'decision must be hire or reject' });
      }

      const evaluation = await prisma.evaluation.findUnique({
        where: { id: evalId },
        include: {
          application: {
            include: {
              job: true,
              candidate: { include: { user: true } },
            },
          },
        },
      });

      if (!evaluation) {
        return res.status(404).json({ success: false, error: 'Evaluation not found' });
      }

      if (evaluation.application.job.org_id !== orgId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }

      
      const updatedEvaluation = await prisma.evaluation.update({
        where: { id: evalId },
        data: {
          decision: decision === 'hire' ? 'hire' : 'reject',
          reasoning: notes ? `HR Override: ${notes}` : `HR Override applied: ${decision}`,
        },
      });

      const appId = evaluation.application_id;
      const nextStatus = decision === 'hire' ? 'offered' : 'rejected';

      
      
      const job = evaluation.application.job;
      const offerSalary = decision === 'hire' ? deriveSalary(job.salary) : null;

      if (decision === 'hire' && offerSalary === null) {
        return res.status(422).json({
          success: false,
          error: `Cannot generate an offer for "${job.title}": the job has no salary configured. Add a salary to the job before generating an offer.`,
        });
      }

      await prisma.application.update({
        where: { id: appId },
        data: { status: nextStatus },
      });

      if (decision === 'hire') {
        const { offer, isNew } = await upsertOffer({
          applicationId: appId,
          job,
          salary: offerSalary as number,
          offerLetterContent: `Official Job Offer for ${job.title} (Approved by HR Override)`,
        });

        
        if (isNew) {
          const candidateName = evaluation.application.candidate.user.email.split('@')[0];
          await emailService.sendOfferEmail(
            evaluation.application.candidate.user.email,
            candidateName,
            job.title,
            { salary: offer.salary, equity: offer.equity ?? undefined, magicLinkToken: offer.magic_link_token! }
          );
        }

        return res.json({
          success: true,
          data: { evaluation: updatedEvaluation, offer, status: 'offered' },
        });
      } else {
        const candidateName = evaluation.application.candidate.user.email.split('@')[0];
        await emailService.sendConstructiveRejection(
          evaluation.application.candidate.user.email,
          candidateName,
          evaluation.application.job.title,
          ['System Design', 'Algorithmic Efficiency'],
          notes || 'Thank you for interviewing with us. Following our HR review, we are unable to proceed at this time.'
        );

        return res.json({
          success: true,
          data: { evaluation: updatedEvaluation, status: 'rejected' },
        });
      }
    } catch (err) {
      return next(err);
    }
  }
);