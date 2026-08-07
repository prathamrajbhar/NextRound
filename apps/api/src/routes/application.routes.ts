import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import {
  ApplicationCreateSchema,
  ApplicationStatusOverrideSchema,
  ApplicationScheduleSchema,
} from '@nextround/shared';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireOrgScope } from '../middleware/orgScope';
import { enqueueScreening } from '../lib/queues/screening.queue';
import { enqueueScheduling } from '../lib/queues/scheduling.queue';
import { enqueueAssessment } from '../lib/queues/assessment.queue';
import { enqueueCoding } from '../lib/queues/coding.queue';
import { emailService } from '../services/email.service';

export const applicationRouter = Router();

// Helper to check parameter pollution / spoofing attempt
function checkOrgParamPollution(req: Request, res: Response): boolean {
  if (req.body && (req.body.org_id || req.body.orgId)) {
    res.status(403).json({ success: false, error: 'Forbidden: org_id cannot be supplied in body' });
    return true;
  }
  if (req.query && (req.query.org_id || req.query.orgId)) {
    res.status(403).json({ success: false, error: 'Forbidden: org_id cannot be supplied in query' });
    return true;
  }
  return false;
}

// POST /api/v1/applications - Candidate submit application
applicationRouter.post(
  '/',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = ApplicationCreateSchema.parse(req.body);

      // Find or create candidate profile
      let profile = await prisma.candidateProfile.findUnique({
        where: { user_id: req.user!.userId },
      });

      if (!profile) {
        profile = await prisma.candidateProfile.create({
          data: {
            user_id: req.user!.userId,
            resume_url: validated.resumeUrl || null,
          },
        });
      } else if (validated.resumeUrl) {
        profile = await prisma.candidateProfile.update({
          where: { id: profile.id },
          data: { resume_url: validated.resumeUrl },
        });
      }

      // Check job exists and is active/published
      const job = await prisma.job.findUnique({
        where: { id: validated.jobId },
      });

      if (!job || (job.status !== 'published' && job.status !== 'active')) {
        return res.status(400).json({
          success: false,
          error: 'Job is not open for applications',
        });
      }

      // Prevent duplicate application
      const existingApp = await prisma.application.findUnique({
        where: {
          candidate_id_job_id: {
            candidate_id: profile.id,
            job_id: validated.jobId,
          },
        },
      });

      if (existingApp) {
        return res.status(400).json({
          success: false,
          error: 'You have already applied for this job',
        });
      }

      // Create Application
      const application = await prisma.application.create({
        data: {
          candidate_id: profile.id,
          job_id: validated.jobId,
          status: 'applied',
        },
        include: {
          job: {
            select: { id: true, title: true, org_id: true },
          },
        },
      });

      // Send confirmation email asynchronously
      if (req.user?.email) {
        const candidateName = req.user.email.split('@')[0];
        emailService.sendApplicationReceived(
          req.user.email,
          candidateName,
          application.job.title
        ).catch((err) => console.error('Failed to send confirmation email:', err));
      }

      // Enqueue screening agent processing
      try {
        await enqueueScreening(application.id, {
          candidateId: profile.id,
          jobId: application.job_id,
          resumeUrl: profile.resume_url,
          timestamp: new Date().toISOString(),
        });
      } catch (queueErr) {
        console.error('Failed to enqueue screening job:', queueErr);
      }

      return res.status(201).json({
        success: true,
        data: { application },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/applications/my - Candidate get own applications
applicationRouter.get(
  '/my',
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
          data: { applications: [] },
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
          evaluations: true,
          interview: true,
          offer: true,
        },
        orderBy: { applied_at: 'desc' },
      });

      return res.json({
        success: true,
        data: { applications },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/applications/:id - Fetch single application details
applicationRouter.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const appId = req.params.id as string;

      const application = await prisma.application.findUnique({
        where: { id: appId },
        include: {
          job: {
            include: {
              organization: { select: { id: true, name: true, logo_url: true } },
            },
          },
          candidate: {
            include: {
              user: { select: { id: true, email: true } },
            },
          },
          evaluations: true,
          interview: true,
          assessments: true,
          coding_submissions: true,
          offer: true,
        },
      });

      if (!application) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      // Multi-tenant RBAC check
      if (req.user!.role === 'hr') {
        if (!req.user!.orgId || application.job.org_id !== req.user!.orgId) {
          return res.status(403).json({ success: false, error: 'Forbidden: Access denied to application' });
        }
      } else if (req.user!.role === 'candidate') {
        if (application.candidate.user_id !== req.user!.userId) {
          return res.status(403).json({ success: false, error: 'Forbidden: Access denied to application' });
        }
      }

      return res.json({
        success: true,
        data: { application },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /api/v1/applications/:id/status - HR override stage status
applicationRouter.patch(
  '/:id/status',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const appId = req.params.id as string;

      const application = await prisma.application.findUnique({
        where: { id: appId },
        include: { job: true },
      });

      if (!application) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      if (application.job.org_id !== req.user!.orgId!) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied to application' });
      }

      const validated = ApplicationStatusOverrideSchema.parse(req.body);

      const updatedApp = await prisma.application.update({
        where: { id: appId },
        data: {
          status: validated.status as any,
        },
      });

      // Optionally record evaluation reasoning if provided
      if (validated.reasoning) {
        await prisma.evaluation.upsert({
          where: { application_id: appId },
          create: {
            application_id: appId,
            stage: validated.status,
            reasoning: validated.reasoning,
          },
          update: {
            stage: validated.status,
            reasoning: validated.reasoning,
          },
        });
      }

      return res.json({
        success: true,
        data: { application: updatedApp },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/applications/:id/schedule - Schedule HR round / voice interview
applicationRouter.post(
  '/:id/schedule',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const appId = req.params.id as string;

      const application = await prisma.application.findUnique({
        where: { id: appId },
        include: { job: true, candidate: true },
      });

      if (!application) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      // RBAC check
      if (req.user!.role === 'hr') {
        if (application.job.org_id !== req.user!.orgId!) {
          return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
        }
      } else if (req.user!.role === 'candidate') {
        if (application.candidate.user_id !== req.user!.userId) {
          return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
        }
      }

      const validated = ApplicationScheduleSchema.parse(req.body);
      const scheduledTime = validated.scheduledAt ? new Date(validated.scheduledAt) : new Date();

      // Update HR round scheduled info or Interview scheduled status
      const updatedApp = await prisma.application.update({
        where: { id: appId },
        data: {
          status: 'interview_scheduled',
          hr_round_status: 'scheduled',
          hr_round_scheduled_at: scheduledTime,
        },
      });

      // Upsert Interview record
      const interview = await prisma.interview.upsert({
        where: { application_id: appId },
        create: {
          application_id: appId,
          scheduled_at: scheduledTime,
          status: 'scheduled',
        },
        update: {
          scheduled_at: scheduledTime,
          status: 'scheduled',
        },
      });

      return res.json({
        success: true,
        data: { application: updatedApp, interview },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/applications/:id/withdraw - Candidate withdraw application
applicationRouter.post(
  '/:id/withdraw',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;

      const application = await prisma.application.findUnique({
        where: { id: appId },
        include: { candidate: true },
      });

      if (!application) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      if (application.candidate.user_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied to application' });
      }

      const updatedApp = await prisma.application.update({
        where: { id: appId },
        data: { status: 'withdrawn' },
      });

      return res.json({
        success: true,
        data: { application: updatedApp, message: 'Application withdrawn successfully' },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/applications/:id/assessment/aptitude - Fetch seed aptitude test questions
applicationRouter.get(
  '/:id/assessment/aptitude',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;
      const app = await prisma.application.findUnique({
        where: { id: appId },
        include: { candidate: true },
      });

      if (!app || app.candidate.user_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }

      const rawQuestions = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../data/aptitude-questions.json'), 'utf-8')
      );

      // Strip correctIndex before returning to client to prevent answer leakage
      const sanitizedQuestions = rawQuestions.map((q: any) => ({
        id: q.id,
        category: q.category,
        question: q.question,
        options: q.options,
        difficulty: q.difficulty,
      }));

      return res.json({
        success: true,
        data: { questions: sanitizedQuestions },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/applications/:id/assessment/aptitude - Submit aptitude assessment answers
applicationRouter.post(
  '/:id/assessment/aptitude',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;
      const { answers, totalTimeSeconds, tabSwitchCount } = req.body;

      const app = await prisma.application.findUnique({
        where: { id: appId },
        include: { candidate: true },
      });

      if (!app || app.candidate.user_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }

      // Enqueue assessment scoring job in BullMQ
      await enqueueAssessment(appId, answers || [], { totalTimeSeconds, tabSwitchCount });

      return res.json({
        success: true,
        message: 'Aptitude assessment submitted successfully. Processing score...',
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/applications/:id/assessment/coding - Fetch coding problem
applicationRouter.get(
  '/:id/assessment/coding',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;
      const app = await prisma.application.findUnique({
        where: { id: appId },
        include: { candidate: true, job: true },
      });

      if (!app || app.candidate.user_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }

      const rawProblems = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../data/coding-problems.json'), 'utf-8')
      );

      // Match configured job problem ID or default to first problem
      const jobConfig = (app.job.thresholds as any) || {};
      const targetProblemId = jobConfig.codingProblemId || 'virtualized-list';
      const problem = rawProblems.find((p: any) => p.id === targetProblemId) || rawProblems[0];

      // Strip hidden test cases before sending to candidate
      const sanitizedProblem = {
        ...problem,
        testCases: problem.testCases.filter((tc: any) => !tc.hidden),
      };

      return res.json({
        success: true,
        data: { problem: sanitizedProblem },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/applications/:id/assessment/coding - Submit candidate code
applicationRouter.post(
  '/:id/assessment/coding',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;
      const { problemId, code, language } = req.body;

      const app = await prisma.application.findUnique({
        where: { id: appId },
        include: { candidate: true },
      });

      if (!app || app.candidate.user_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }

      // Create CodingSubmission record in DB
      const submission = await prisma.codingSubmission.create({
        data: {
          application_id: appId,
          code: code || '',
          language: language || 'python',
          test_results: { status: 'running', complexity: 'Pending', ai_feedback: 'Executing test cases in Python sandbox...' },
          pass_rate: 0.0,
        },
      });

      // Enqueue sandbox execution job in BullMQ
      await enqueueCoding(appId, problemId || 'virtualized-list', code || '', language || 'python', submission.id);

      return res.json({
        success: true,
        data: { submissionId: submission.id, status: 'running' },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/applications/:id/assessment/coding/:submissionId - Poll submission status
applicationRouter.get(
  '/:id/assessment/coding/:submissionId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const submissionId = req.params.submissionId as string;
      const submission = await prisma.codingSubmission.findUnique({
        where: { id: submissionId },
      });

      if (!submission) {
        return res.status(404).json({ success: false, error: 'Submission not found' });
      }

      return res.json({
        success: true,
        data: { submission },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/applications/:id/assessment/video-prompts - Fetch video screening prompts
applicationRouter.get(
  '/:id/assessment/video-prompts',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;
      const app = await prisma.application.findUnique({
        where: { id: appId },
        include: { candidate: true, job: true },
      });

      if (!app || app.candidate.user_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }

      const prompts = [
        "Introduce yourself and briefly describe your engineering background.",
        "Describe a complex technical challenge you solved recently and how you approached it.",
        "How do you handle disagreement with senior team members on system design or architecture?"
      ];

      return res.json({
        success: true,
        data: { prompts },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/applications/:id/assessment/video - Submit recorded video screening answer
applicationRouter.post(
  '/:id/assessment/video',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;
      const { video_url, duration_seconds } = req.body;

      const app = await prisma.application.findUnique({
        where: { id: appId },
        include: { candidate: true },
      });

      if (!app || app.candidate.user_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }

      const evaluation = await prisma.evaluation.upsert({
        where: { application_id: appId },
        create: {
          application_id: appId,
          stage: 'video_screening',
          reasoning: 'Video response submitted and queued for transcription.',
          bias_flag: false,
          bias_report: { video_url, duration_seconds },
        },
        update: {
          stage: 'video_screening',
          reasoning: 'Video response submitted and queued for transcription.',
          bias_report: { video_url, duration_seconds },
        },
      });

      return res.json({
        success: true,
        data: { evaluation, message: 'Video uploaded successfully. Transcription queued.' },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/applications/:id/reschedule - Reschedule interview request
applicationRouter.post(
  '/:id/reschedule',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;
      const app = await prisma.application.findUnique({
        where: { id: appId },
        include: { candidate: { include: { user: true } }, job: true },
      });

      if (!app || app.candidate.user_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }

      await enqueueScheduling(appId, {
        action: 'reschedule',
        candidateEmail: app.candidate.user.email,
        jobTitle: app.job.title,
      });

      return res.json({
        success: true,
        message: 'Reschedule request submitted. AI Scheduler is negotiating new slots...',
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/applications/offer/token/:token - Get offer by magic link token
applicationRouter.get(
  '/offer/token/:token',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.params.token as string;
      const offer = await prisma.offer.findFirst({
        where: { id: token },
        include: {
          application: {
            include: {
              job: {
                include: {
                  organization: { select: { name: true, logo_url: true } },
                },
              },
              candidate: {
                include: {
                  user: { select: { email: true } },
                },
              },
            },
          },
        },
      });

      if (!offer) {
        return res.status(404).json({ success: false, error: 'Invalid or expired offer token' });
      }

      return res.json({
        success: true,
        data: { offer },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/applications/:id/offer - Fetch application offer details
applicationRouter.get(
  '/:id/offer',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const appId = req.params.id as string;

      const application = await prisma.application.findUnique({
        where: { id: appId },
        include: {
          offer: true,
          candidate: true,
          job: true,
        },
      });

      if (!application || !application.offer) {
        return res.status(404).json({ success: false, error: 'No offer found for application' });
      }

      // Check access permission
      if (req.user!.role === 'candidate' && application.candidate.user_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }
      if (req.user!.role === 'hr' && application.job.org_id !== req.user!.orgId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
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

// POST /api/v1/applications/:id/offer/sign - Digitally sign offer
applicationRouter.post(
  '/:id/offer/sign',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;
      const { signature_svg, magic_link_token } = req.body;

      if (!signature_svg) {
        return res.status(400).json({ success: false, error: 'signature_svg is required' });
      }

      let offer = await prisma.offer.findUnique({
        where: { application_id: appId },
      });

      if (!offer && magic_link_token) {
        offer = await prisma.offer.findFirst({
          where: { id: magic_link_token },
        });
      }

      if (!offer) {
        return res.status(404).json({ success: false, error: 'Offer not found for application' });
      }

      // Update offer status and save signature SVG vector
      const updatedOffer = await prisma.offer.update({
        where: { id: offer.id },
        data: {
          signature_svg,
          status: 'accepted',
        },
      });

      // Update application status to accepted
      await prisma.application.update({
        where: { id: offer.application_id },
        data: { status: 'accepted' },
      });

      return res.json({
        success: true,
        data: { offer: updatedOffer, status: 'accepted' },
      });
    } catch (err) {
      return next(err);
    }
  }
);

