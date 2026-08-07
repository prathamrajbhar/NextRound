import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { CandidateProfileSchema } from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { uploadFile } from '../../lib/s3';
import { serializeApplicationList } from '../../lib/serializers';

export const candidateRouter = Router();

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.includes('document')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF or document files are allowed'));
    }
  },
});

// POST /api/v1/candidate/profile - Create or update candidate profile with optional resume upload
candidateRouter.post(
  '/profile',
  authenticate,
  requireRole('candidate'),
  upload.single('resume'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      let resumeUrl: string | undefined = undefined;

      if (req.file) {
        const fileKey = `resumes/${req.user.userId}/${Date.now()}-${req.file.originalname}`;
        resumeUrl = await uploadFile(fileKey, req.file.buffer, req.file.mimetype);
      }

      let bodyData = req.body;
      if (typeof req.body.data === 'string') {
        try {
          bodyData = JSON.parse(req.body.data);
        } catch (e) {
          // keep bodyData as is
        }
      }

      const validated = CandidateProfileSchema.parse(bodyData);

      // Only update fields the client actually sent, so partial updates
      // (e.g. from the Settings page) never wipe existing profile data.
      const bodyHas = (key: string) => Object.prototype.hasOwnProperty.call(bodyData, key);

      const profile = await prisma.candidateProfile.upsert({
        where: { user_id: req.user.userId },
        create: {
          user_id: req.user.userId,
          full_name: validated.fullName,
          headline: validated.headline,
          phone: validated.phone,
          location: validated.location,
          timezone: validated.timezone,
          linkedin_url: validated.linkedinUrl,
          github_url: validated.githubUrl,
          portfolio_url: validated.portfolioUrl,
          bio: validated.bio,
          skills: validated.skills,
          target_roles: validated.targetRoles,
          years_of_experience: validated.yearsOfExperience,
          work_mode: validated.workMode,
          current_ctc: validated.currentCtc,
          target_locations: validated.targetLocations,
          expected_salary: validated.expectedSalary,
          notice_period: validated.noticePeriod,
          work_authorization: validated.workAuthorization,
          proud_project: validated.proudProject,
          work_values: validated.workValues,
          availability: validated.availability,
          resume_url: resumeUrl || validated.resumeUrl,
        },
        update: {
          ...(bodyHas('fullName') && validated.fullName !== undefined ? { full_name: validated.fullName } : {}),
          ...(bodyHas('headline') && validated.headline !== undefined ? { headline: validated.headline } : {}),
          ...(bodyHas('phone') && validated.phone !== undefined ? { phone: validated.phone } : {}),
          ...(bodyHas('location') && validated.location !== undefined ? { location: validated.location } : {}),
          ...(bodyHas('timezone') && validated.timezone !== undefined ? { timezone: validated.timezone } : {}),
          ...(bodyHas('linkedinUrl') && validated.linkedinUrl !== undefined ? { linkedin_url: validated.linkedinUrl } : {}),
          ...(bodyHas('githubUrl') && validated.githubUrl !== undefined ? { github_url: validated.githubUrl } : {}),
          ...(bodyHas('portfolioUrl') && validated.portfolioUrl !== undefined ? { portfolio_url: validated.portfolioUrl } : {}),
          ...(bodyHas('bio') && validated.bio !== undefined ? { bio: validated.bio } : {}),
          ...(bodyHas('skills') ? { skills: validated.skills } : {}),
          ...(bodyHas('targetRoles') ? { target_roles: validated.targetRoles } : {}),
          ...(bodyHas('yearsOfExperience') && validated.yearsOfExperience !== undefined ? { years_of_experience: validated.yearsOfExperience } : {}),
          ...(bodyHas('workMode') && validated.workMode !== undefined ? { work_mode: validated.workMode } : {}),
          ...(bodyHas('currentCtc') && validated.currentCtc !== undefined ? { current_ctc: validated.currentCtc } : {}),
          ...(bodyHas('targetLocations') ? { target_locations: validated.targetLocations } : {}),
          ...(bodyHas('expectedSalary') && validated.expectedSalary !== undefined ? { expected_salary: validated.expectedSalary } : {}),
          ...(bodyHas('noticePeriod') && validated.noticePeriod !== undefined ? { notice_period: validated.noticePeriod } : {}),
          ...(bodyHas('workAuthorization') && validated.workAuthorization !== undefined ? { work_authorization: validated.workAuthorization } : {}),
          ...(bodyHas('proudProject') && validated.proudProject !== undefined ? { proud_project: validated.proudProject } : {}),
          ...(bodyHas('workValues') ? { work_values: validated.workValues } : {}),
          ...(bodyHas('availability') ? { availability: validated.availability } : {}),
          ...(resumeUrl || (bodyHas('resumeUrl') && validated.resumeUrl) ? { resume_url: resumeUrl || validated.resumeUrl } : {}),
        },
      });

      return res.json({
        success: true,
        data: { profile },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/candidate/profile - Get candidate profile
candidateRouter.get(
  '/profile',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const profile = await prisma.candidateProfile.findUnique({
        where: { user_id: req.user.userId },
      });

      if (!profile) {
        return res.status(404).json({ success: false, error: 'Candidate profile not found' });
      }

      return res.json({
        success: true,
        data: { profile },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/candidate/applications - Alias for candidate's own applications
candidateRouter.get(
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

// GET /api/v1/candidate/applications/:id/offer - Fetch candidate application offer
candidateRouter.get(
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
          candidate: true,
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
        data: { offer: application.offer },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/candidate/applications/:id/onboarding - Fetch candidate application onboarding record
candidateRouter.get(
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
        buddyName: 'Alex Rivera (Staff Engineer)',
        managerName: 'Sarah Chen (VP of Engineering)',
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

// GET /api/v1/candidate/applications/:id/video-screening - Fetch async video screening details
candidateRouter.get(
  '/applications/:id/video-screening',
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

      const candidateName = application.candidate.user.email.split('@')[0];
      const deadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const screeningData = {
        id: `scr-${application.id}`,
        applicationId: application.id,
        candidateName,
        jobTitle: application.job.title,
        status: 'invited' as const,
        invitedDate: application.applied_at.toISOString().split('T')[0],
        deadline,
        responses: [
          {
            questionId: 'q1',
            questionText: 'Walk us through your most complex backend or frontend architectural design decision.',
            timeLimitSeconds: 180,
          },
          {
            questionId: 'q2',
            questionText: 'How do you prioritize trade-offs between rapid shipping velocity and codebase maintainability?',
            timeLimitSeconds: 120,
          },
          {
            questionId: 'q3',
            questionText: 'Describe a situation where an system outage occurred and how you managed resolution.',
            timeLimitSeconds: 180,
          },
        ],
      };

      return res.json({
        success: true,
        data: screeningData,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/candidate/applications/:id/video-screening/submit - Submit async video screening responses
candidateRouter.post(
  '/applications/:id/video-screening/submit',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;
      const { responses } = req.body;

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

      return res.json({
        success: true,
        data: { message: 'Video screening submitted successfully', responsesCount: responses?.length || 0 },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/candidate/applications/:id/take-home - Fetch take-home project details
candidateRouter.get(
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

      const candidateName = application.candidate.user.email.split('@')[0];
      const assignedDate = application.applied_at.toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const takeHomeProject = {
        id: `project-${application.id}`,
        applicationId: application.id,
        candidateName,
        title: `Full-Stack Technical Assessment: ${application.job.title}`,
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

// POST /api/v1/candidate/applications/:id/take-home/submit - Submit take-home project repo
candidateRouter.post(
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
        data: { status: 'evaluation' },
      });

      return res.json({
        success: true,
        data: { message: 'Take-home assignment submitted for HR evaluation', repoUrl, comments },
      });
    } catch (err) {
      return next(err);
    }
  }
);


