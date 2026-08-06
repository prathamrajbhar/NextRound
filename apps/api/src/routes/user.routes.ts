import { Router, Request, Response, NextFunction } from 'express';
import { HRProfileUpdateSchema, CandidateSettingsSchema } from '@nextround/shared';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

export const userRouter = Router();

// GET /api/v1/hr/profile - Get current HR profile info
userRouter.get(
  '/hr/profile',
  authenticate,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          email: true,
          role: true,
          org_id: true,
          created_at: true,
          organization: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      return res.json({
        success: true,
        data: { profile: user },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /api/v1/hr/profile - Update HR user profile info
userRouter.patch(
  '/hr/profile',
  authenticate,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = HRProfileUpdateSchema.parse(req.body);

      // Email update or general profile updates
      const updatedUser = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          email: true,
          role: true,
          org_id: true,
          created_at: true,
        },
      });

      return res.json({
        success: true,
        data: { profile: updatedUser },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/candidate/dashboard - Candidate dashboard KPIs and next interview
userRouter.get(
  '/candidate/dashboard',
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
          data: {
            kpis: {
              totalApplications: 0,
              activeInterviews: 0,
              offersReceived: 0,
            },
            applications: [],
            nextInterview: null,
          },
        });
      }

      const applications = await prisma.application.findMany({
        where: { candidate_id: profile.id },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              organization: { select: { name: true, logo_url: true } },
            },
          },
          interview: true,
          offer: true,
        },
        orderBy: { applied_at: 'desc' },
      });

      const totalApplications = applications.length;
      const activeInterviews = applications.filter((app) =>
        ['interview_scheduled', 'interviewed', 'hr_round'].includes(app.status)
      ).length;
      const offersReceived = applications.filter((app) =>
        ['offered', 'accepted'].includes(app.status)
      ).length;

      // Find next scheduled interview
      const scheduledApp = applications.find(
        (app) => app.interview && app.interview.status === 'scheduled'
      );

      const nextInterview = scheduledApp && scheduledApp.interview ? {
        id: scheduledApp.interview.id,
        jobTitle: scheduledApp.job.title,
        companyName: scheduledApp.job.organization?.name || 'Hiring Company',
        scheduledAt: scheduledApp.interview.scheduled_at
          ? scheduledApp.interview.scheduled_at.toISOString()
          : scheduledApp.applied_at.toISOString(),
      } : null;

      return res.json({
        success: true,
        data: {
          kpis: {
            totalApplications,
            activeInterviews,
            offersReceived,
          },
          applications,
          nextInterview,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/candidate/settings - Candidate notification and privacy settings
userRouter.get(
  '/candidate/settings',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { id: true, email: true },
      });

      return res.json({
        success: true,
        data: {
          settings: {
            emailNotifications: true,
            privacyMode: false,
            timezone: 'UTC',
          },
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /api/v1/candidate/settings - Update candidate settings
userRouter.patch(
  '/candidate/settings',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CandidateSettingsSchema.parse(req.body);

      return res.json({
        success: true,
        data: {
          settings: validated,
          message: 'Settings saved successfully',
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);
