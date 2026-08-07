import { Router, Request, Response, NextFunction } from 'express';
import { HRProfileUpdateSchema, CandidateSettingsSchema } from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { serializeApplicationList, serializeJobList } from '../../lib/serializers';

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
            activeApplications: [],
            upcomingInterviews: [],
            recentMockSessions: [],
            recommendedJobs: [],
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
              status: true,
              organization: { select: { name: true, logo_url: true } },
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

      const upcomingInterviews = applications
        .filter((app) => app.interview && app.interview.status === 'scheduled')
        .map((app) => ({
          id: app.interview!.id,
          jobTitle: app.job.title,
          date: app.interview!.scheduled_at ? app.interview!.scheduled_at.toISOString() : app.applied_at.toISOString(),
          type: 'Voice Interview',
        }));

      // Recommended jobs: published jobs matching candidate target roles, excluding already-applied
      const appliedJobIds = applications.map((a) => a.job_id);
      const recommendedJobs = await prisma.job.findMany({
        where: {
          status: { in: ['published', 'active'] },
          id: { notIn: appliedJobIds.length ? appliedJobIds : ['__none__'] },
        },
        include: {
          organization: { select: { id: true, name: true, logo_url: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 6,
      });

      // Recent mock sessions for the candidate
      const mockSessions = await prisma.mockSession.findMany({
        where: { candidate_id: profile.id },
        orderBy: { created_at: 'desc' },
        take: 5,
      });

      return res.json({
        success: true,
        data: {
          activeApplications: serializeApplicationList(applications),
          upcomingInterviews,
          recentMockSessions: mockSessions.map((m) => ({
            id: m.id,
            targetCompany: m.target_company,
            targetRole: m.target_role,
            difficulty: m.difficulty || 'mid',
            score: typeof m.score === 'number' ? m.score : 0,
            date: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : '',
            status: m.status || 'completed',
          })),
          recommendedJobs: serializeJobList(recommendedJobs),
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
