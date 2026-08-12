import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { CandidateProfileSchema } from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { uploadFile } from '../../lib/storage';
import { serializeApplicationList, serializeJobList, serializeOffer } from '../../lib/serializers';
import { extractTextFromBuffer, parseResumeWithGemini, generateFieldWithGemini } from '../../services/resume-parser.service';
import { syncCandidateSocialProfiles } from '../../services/social-sync.service';
import { advanceAssessmentStage } from '../../lib/pipeline';

export const candidateRouter = Router();

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const ext = (file.originalname || '').toLowerCase();
    const isAllowedExt = ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.doc') || ext.endsWith('.txt');
    const isAllowedMime = (file.mimetype || '').includes('pdf') || file.mimetype.includes('document') || file.mimetype.includes('text') || file.mimetype.includes('stream');

    if (isAllowedExt || isAllowedMime || !file.mimetype) {
      cb(null, true);
    } else {
      // Reject non-document files (e.g. .exe, .zip) at the boundary instead of
      // buffering up to 10MB of binary into memory for a parser that can't use it.
      cb(null, false);
    }
  },
});

// POST /api/v1/candidate/parse-resume - Convert resume file to text and parse using Gemini LLM
candidateRouter.post(
  '/parse-resume',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('resume')(req, res, (err) => {
      if (err) {
        console.error('Multer file upload error in /parse-resume:', err);
        return res.status(400).json({ success: false, error: typeof err === 'string' ? err : err.message || 'File upload error' });
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No resume file uploaded' });
      }

      const rawText = await extractTextFromBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      if (!rawText || rawText.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Could not extract text from the uploaded resume file' });
      }

      const parsedData = await parseResumeWithGemini(rawText);

      return res.json({
        success: true,
        data: {
          rawTextLength: rawText.length,
          rawText,
          profile: parsedData,
        },
      });
    } catch (err) {
      console.error('[ParseResume] Processing error:', err);
      return next(err);
    }
  }
);

// POST /api/v1/candidate/regenerate-field - Regenerate a specific profile field using ALL candidate resources (resume, social data, github, linkedin, skills)
candidateRouter.post(
  '/regenerate-field',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { field, rawResumeText, socialData, linkedinUrl, githubUrl, portfolioUrl, skills, targetRoles, yearsOfExperience, currentValue } = req.body || {};

      if (!field || !['proudProject', 'bio', 'headline'].includes(field)) {
        return res.status(400).json({ success: false, error: 'Valid field ("proudProject", "bio", "headline") is required' });
      }

      const text = await generateFieldWithGemini({
        field,
        rawResumeText,
        socialData,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        skills,
        targetRoles,
        yearsOfExperience,
        currentValue,
      });

      return res.json({
        success: true,
        data: {
          field,
          text,
        },
      });
    } catch (err) {
      console.error('[RegenerateField] Processing error:', err);
      return next(err);
    }
  }
);

// POST /api/v1/candidate/sync-social - Scrape and sync GitHub & LinkedIn profiles
candidateRouter.post(
  '/sync-social',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { githubUrl, linkedinUrl } = req.body || {};
      if (!githubUrl && !linkedinUrl) {
        return res.status(400).json({ success: false, error: 'Provide at least a githubUrl or linkedinUrl to sync' });
      }

      const socialData = await syncCandidateSocialProfiles(githubUrl, linkedinUrl);

      // A real LinkedIn sync now runs against the user-approved bytemap scraper.
      // When it genuinely fails (profile not found, scraper/network error), report
      // the honest reason with a 4xx/5xx instead of claiming success. An upstream
      // timeout is an upstream error (504), not a client-side problem.
      const linkedinFailed = Boolean(linkedinUrl) && socialData.linkedin?.synced === false;
      if (linkedinFailed) {
        const reason = socialData.linkedin?.reason || 'LinkedIn sync failed.';
        const timedOut = /timed out/i.test(reason);
        const statusCode = socialData.linkedin?.status === 'not_found' ? 404 : timedOut ? 504 : 422;
        return res.status(statusCode).json({
          success: false,
          error: reason,
        });
      }

      return res.json({
        success: true,
        data: socialData,
      });
    } catch (err) {
      console.error('[SyncSocial] Processing error:', err);
      return next(err);
    }
  }
);


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
      let extractedRawText: string | undefined = undefined;
      let extractedParsedResume: Record<string, unknown> | undefined = undefined;

      if (req.file) {
        const fileKey = `resumes/${req.user.userId}/${Date.now()}-${req.file.originalname}`;
        resumeUrl = await uploadFile(fileKey, req.file.buffer, req.file.mimetype);

        try {
          extractedRawText = await extractTextFromBuffer(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname
          );
          if (extractedRawText) {
            extractedParsedResume = (await parseResumeWithGemini(extractedRawText)) as unknown as Record<string, unknown>;
          }
        } catch (extractErr) {
          console.error('Failed auto-extracting text on profile upload:', extractErr);
        }
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
          raw_resume_text: validated.rawResumeText || extractedRawText,
          parsed_resume: validated.parsedResume || extractedParsedResume || {},
          social_data: (validated as any).socialData || {},
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
          ...(extractedRawText || (bodyHas('rawResumeText') && validated.rawResumeText) ? { raw_resume_text: validated.rawResumeText || extractedRawText } : {}),
          ...(extractedParsedResume || (bodyHas('parsedResume') && validated.parsedResume) ? { parsed_resume: validated.parsedResume || extractedParsedResume } : {}),
          ...(bodyHas('socialData') && (validated as any).socialData ? { social_data: (validated as any).socialData } : {}),
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

// GET /api/v1/candidate/dashboard - Aggregated candidate dashboard data
candidateRouter.get(
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

      // No real buddy/manager assignment exists on the Job, Offer, or org
      // settings, so these are null (honest "not assigned") rather than
      // fabricated people.
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
        // Neutral title: the assignment is a generic template, so it must not
        // claim to be a "Full-Stack" assessment for a role that may not be one.
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

      // Keep the application in the assessment phase (screening_completed);
      // advance to interview_scheduled only once all enabled modalities pass.
      await prisma.application.update({
        where: { id: appId },
        data: { status: 'screening_completed' },
      });

      await advanceAssessmentStage(appId).catch((err) =>
        console.error(`Failed to advance assessment stage for application ${appId}:`, err)
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


