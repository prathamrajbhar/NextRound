import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope, rejectOrgIdParam } from '../../middleware/orgScope';

export const hrHoldQueueRouter = Router();

// Org scoping is JWT-derived; never accept a client-supplied org_id.
hrHoldQueueRouter.use(rejectOrgIdParam);

// GET /api/v1/hr/hold-queue - Fetch applications on hold for manual HR review
hrHoldQueueRouter.get(
  '/hold-queue',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.orgId!;

      const items = await prisma.application.findMany({
        where: {
          job: { org_id: orgId },
          evaluations: {
            some: {
              decision: 'hold_for_review',
            },
          },
        },
        include: {
          job: { select: { id: true, title: true } },
          candidate: {
            include: {
              user: { select: { id: true, email: true } },
            },
          },
          evaluations: true,
        },
        orderBy: { applied_at: 'desc' },
      });

      return res.json({
        success: true,
        data: { holdQueue: items },
      });
    } catch (err) {
      return next(err);
    }
  }
);