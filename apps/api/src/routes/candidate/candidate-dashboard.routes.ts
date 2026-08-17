import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { serializeApplicationList, serializeJobList } from '../../lib/serializers';

export const candidateDashboardRouter = Router();

candidateDashboardRouter.get(
  '/dashboard',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await prisma.candidateProfile.findUnique({
        where: { user_id: req.user!.userId },
      });

      if (!profile) {
        return res.json({
          success: true,
          data: { applications: [], jobs: [], latestMockScore: null },
        });
      }

      const [applications, jobs, mockSessions] = await Promise.all([
        prisma.application.findMany({
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
              select: {
                id: true,
                user: { select: { email: true } },
                resume_url: true,
                skills: true,
                target_roles: true,
              },
            },
            evaluations: true,
            interview: true,
            offer: true,
          },
          orderBy: { applied_at: 'desc' },
        }),
        prisma.job.findMany({
          where: { status: { in: ['published', 'active'] as any } },
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            organization: {
              select: { id: true, name: true, logo_url: true, industry: true },
            },
          },
        }),
        prisma.mockSession.findMany({
          where: { candidate_id: profile.id, final_score: { not: null } },
          orderBy: { completed_at: 'desc' },
          take: 1,
        }),
      ]);

      const latestMockScore = mockSessions.length > 0 ? mockSessions[0].final_score : null;

      return res.json({
        success: true,
        data: {
          applications: serializeApplicationList(applications),
          jobs: serializeJobList(jobs),
          latestMockScore,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

candidateDashboardRouter.get(
  '/applications',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await prisma.candidateProfile.findUnique({
        where: { user_id: req.user!.userId },
      });

      if (!profile) {
        return res.json({
          success: true,
          data: [],
        });
      }

      const applications = await prisma.application.findMany({
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
            select: {
              id: true,
              user: { select: { email: true } },
              resume_url: true,
              skills: true,
              target_roles: true,
            },
          },
          evaluations: true,
          interview: true,
          offer: true,
        },
        orderBy: { applied_at: 'desc' },
      });

      return res.json({
        success: true,
        data: serializeApplicationList(applications),
      });
    } catch (err) {
      return next(err);
    }
  }
);
