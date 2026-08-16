import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { logger } from '../../lib/logger';
import { serializeOffer } from '../../lib/serializers';
import { advanceAssessmentStage } from '../../lib/pipeline';

export const candidateApplicationsRouter = Router();


candidateApplicationsRouter.get(
  '/applications/:id/offer',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;

      const application = await prisma.application.findUnique({
        where: { id: appId },
        include: {
          offer: true,
          candidate: { include: { user: { select: { email: true } } } },
          job: {
            include: { organization: true },
          },
        },
      });

      if (!application || application.candidate.user_id !== req.user!.userId) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      if (!application.offer) {
        return res.status(404).json({ success: false, error: 'No offer found for application' });
      }

      return res.json({
        success: true,
        data: serializeOffer(application.offer, application),
      });
    } catch (err) {
      return next(err);
    }
  }
);


candidateApplicationsRouter.get(
  '/applications/:id/onboarding',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;

      const application = await prisma.application.findUnique({
        where: { id: appId },
        include: {
          candidate: { include: { user: true } },
          job: { include: { organization: true } },
          offer: true,
        },
      });

      if (!application || application.candidate.user_id !== req.user!.userId) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      if (
        application.status !== 'decided' &&
        application.status !== 'offered' &&
        application.status !== 'accepted'
      ) {
        return res.status(404).json({ success: false, error: 'Onboarding is not active for this application stage' });
      }

      const candidateName = application.candidate.user.email.split('@')[0];
      const startDate = application.offer?.start_date
        ? application.offer.start_date.toISOString().split('T')[0]
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const defaultTasks = [
        {
          id: 'task-1',
          title: 'Sign Digital Offer Letter & NDA',
          description: 'Review compensation package and submit electronic signature',
          category: 'paperwork',
          owner: 'New Hire',
          status: application.offer?.status === 'accepted' ? 'completed' : 'pending',
          dueDate: startDate,
        },
        {
          id: 'task-2',
          title: 'Submit Tax & Identity Verification Documents',
          description: 'Upload W-4/I-9 or national ID documents for HR background check',
          category: 'paperwork',
          owner: 'New Hire',
          status: 'pending',
          dueDate: startDate,
        },
        {
          id: 'task-3',
          title: 'Select Work Hardware & Peripheral Setup',
          description: 'Configure developer laptop (MacBook Pro / ThinkPad) and monitor accessories',
          category: 'equipment',
          owner: 'IT',
          status: 'in_progress',
          dueDate: startDate,
        },
        {
          id: 'task-4',
          title: 'Complete Corporate Email & SSO Security Provisioning',
          description: 'Set up 2FA, 1Password vault, and GitHub team permissions',
          category: 'access',
          owner: 'IT',
          status: 'pending',
          dueDate: startDate,
        },
        {
          id: 'task-5',
          title: 'Day-1 Intro Sync with Onboarding Buddy',
          description: 'Meet your assigned engineering peer for architecture overview',
          category: 'social',
          owner: 'HR',
          status: 'pending',
          dueDate: startDate,
        },
      ];

      const completedCount = defaultTasks.filter((t) => t.status === 'completed').length;
      const progressPercent = Math.round((completedCount / defaultTasks.length) * 100);

      
      
      
      const onboardingRecord = {
        id: `onboard-${application.id}`,
        applicationId: application.id,
        candidateName,
        candidateAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidateName}`,
        jobTitle: application.job.title,
        orgName: application.job.organization.name,
        startDate,
        buddyName: null,
        managerName: null,
        progressPercent,
        tasks: defaultTasks,
      };

      return res.json({
        success: true,
        data: onboardingRecord,
      });
    } catch (err) {
      return next(err);
    }
  }
);


candidateApplicationsRouter.get(
  '/applications/:id/take-home',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;

      const application = await prisma.application.findUnique({
        where: { id: appId },
        include: {
          candidate: { include: { user: true } },
          job: true,
        },
      });

      if (!application || application.candidate.user_id !== req.user!.userId) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      if (application.status === 'applied' || application.status === 'screening') {
        return res.status(404).json({ success: false, error: 'Take-home project is not active for this application stage' });
      }

      const candidateName = application.candidate.user.email.split('@')[0];
      const assignedDate = application.applied_at.toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const takeHomeProject = {
        id: `project-${application.id}`,
        applicationId: application.id,
        candidateName,
        
        
        title: `Technical Assessment: ${application.job.title}`,
        description: `Build a production-ready reactive dashboard showcasing state management, clean component modularity, strict error handling, and unit test coverage.`,
        status: 'assigned' as const,
        assignedDate,
        dueDate,
        rubric: [
          { criterion: 'Architecture & File Structure', weight: 30 },
          { criterion: 'TypeScript Strictness & Code Quality', weight: 25 },
          { criterion: 'UI Design & Accessibility', weight: 25 },
          { criterion: 'Automated Test Coverage', weight: 20 },
        ],
      };

      return res.json({
        success: true,
        data: takeHomeProject,
      });
    } catch (err) {
      return next(err);
    }
  }
);


candidateApplicationsRouter.post(
  '/applications/:id/take-home/submit',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;
      const { repoUrl, comments } = req.body;

      if (!repoUrl) {
        return res.status(400).json({ success: false, error: 'repoUrl is required' });
      }

      const application = await prisma.application.findUnique({
        where: { id: appId },
        include: { candidate: true },
      });

      if (!application || application.candidate.user_id !== req.user!.userId) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      
      
      await prisma.application.update({
        where: { id: appId },
        data: { status: 'screening_completed' },
      });

      await advanceAssessmentStage(appId).catch((err) =>
        logger.child('CandidateApps').error(`Failed to advance assessment stage for application ${appId}:`, err)
      );

      return res.json({
        success: true,
        data: { message: 'Take-home assignment submitted for HR evaluation', repoUrl, comments },
      });
    } catch (err) {
      return next(err);
    }
  }
);