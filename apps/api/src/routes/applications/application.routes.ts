import { Router, Request, Response, NextFunction } from 'express';
import {
  ApplicationCreateSchema,
  ApplicationStatusOverrideSchema,
  ApplicationScheduleSchema,
} from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope } from '../../middleware/orgScope';
import { enqueueScreening } from '../../lib/queues/screening.queue';
import { enqueueScheduling } from '../../lib/queues/scheduling.queue';
import { enqueueAssessment } from '../../lib/queues/assessment.queue';
import { enqueueCoding } from '../../lib/queues/coding.queue';
import { emailService } from '../../services/email.service';
import { serializeApplication, serializeApplicationList, serializeOffer } from '../../lib/serializers';
import { evaluateApplicationScreening } from '../../services/screening-evaluator.service';
import { generateAiAptitudeQuestions, generateAptitudeChunk } from '../../services/ai-question-generator.service';
import { generateAiCodingProblem } from '../../services/ai-coding-generator.service';
import { executeCodingSubmission } from '../../services/coding-executor.service';

export const applicationRouter = Router();

// Helper to check parameter pollution / spoofing attempt
// Verify an application belongs to the authenticated candidate (via CandidateProfile)
async function candidateOwnsApplication(applicationId: string, userId: string): Promise<boolean> {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, candidate: { user_id: userId } },
    select: { id: true },
  });
  return Boolean(app);
}

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
          candidate: {
            include: {
              user: { select: { email: true } },
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

// GET /api/v1/applications - HR list applications (optionally filtered by ?jobId)
applicationRouter.get(
  '/',
  authenticate,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const jobId = req.query.jobId as string | undefined;
      const orgId = req.user!.orgId!;

      if (jobId) {
        // Validate the job belongs to the HR org
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job || job.org_id !== orgId) {
          return res.status(403).json({ success: false, error: 'Forbidden: Access denied to job applications' });
        }
      }

      const applications = await prisma.application.findMany({
        where: {
          ...(jobId ? { job_id: jobId as string } : {}),
          job: { org_id: orgId },
        },
        include: {
          job: {
            include: {
              organization: { select: { id: true, name: true, logo_url: true } },
            },
          },
          candidate: {
            include: {
              user: { select: { email: true } },
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

      // Expose the Scheduler Agent's real slot proposals on the application
      // payload. Slots are persisted as a scheduler_agent AgentLog keyed by
      // interview id (internal POST /interviews/:id/schedule-slots). When no
      // slots have been generated the field is omitted so the client renders an
      // honest empty state instead of fabricated 'Tomorrow at 10:00 AM' times.
      let scheduledSlots: string[] = [];
      if (application.interview) {
        const slotLog = await prisma.agentLog.findFirst({
          where: {
            agent_name: 'scheduler_agent',
            action: 'slots_generated',
            input: { path: ['interviewId'], equals: application.interview.id },
          },
          orderBy: { created_at: 'desc' },
        });
        const output =
          slotLog?.output && typeof slotLog.output === 'object'
            ? (slotLog.output as Record<string, unknown>)
            : undefined;
        if (output && Array.isArray(output.slots)) {
          scheduledSlots = output.slots.filter((s): s is string => typeof s === 'string');
        }
      }

      return res.json({
        success: true,
        data: serializeApplication(application, { scheduledSlots }),
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/applications/:id/run-screening - Run or re-run AI screening evaluation
applicationRouter.post(
  '/:id/run-screening',
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

      // Authorization check
      if (req.user!.role === 'hr') {
        if (application.job.org_id !== req.user!.orgId!) {
          return res.status(403).json({ success: false, error: 'Forbidden: Access denied to application' });
        }
      } else if (req.user!.role === 'candidate') {
        if (application.candidate.user_id !== req.user!.userId) {
          return res.status(403).json({ success: false, error: 'Forbidden: Access denied to application' });
        }
      }

      const { application: updatedApp, evaluation } = await evaluateApplicationScreening(appId);

      return res.json({
        success: true,
        data: {
          application: serializeApplication(updatedApp),
          evaluation,
        },
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

// PATCH /api/v1/applications/:id - HR advance candidate stage (Kanban). Maps stage name to status.
applicationRouter.patch(
  '/:id',
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

      const { stage, status } = req.body as Record<string, string | undefined>;

      const stageToStatus: Record<string, string> = {
        Sourced: 'applied',
        Screened: 'screening_completed',
        Assessment: 'assessment',
        Interview: 'interview_scheduled',
        'HR Round': 'hr_round',
        Panel: 'evaluation',
        Decision: 'decided',
      };

      let nextStatus: string;
      if (status && typeof status === 'string' && ['applied', 'screening', 'screening_completed', 'assessment', 'interview_scheduled', 'interviewed', 'evaluation', 'hr_round', 'decided', 'offered', 'accepted', 'rejected', 'withdrawn'].includes(status)) {
        nextStatus = status;
      } else if (stage && typeof stage === 'string') {
        nextStatus = stageToStatus[stage] || application.status;
      } else {
        return res.status(400).json({ success: false, error: 'Provide a stage or status to advance the candidate' });
      }

      const updatedApp = await prisma.application.update({
        where: { id: appId },
        data: { status: nextStatus as any },
      });

      return res.json({
        success: true,
        data: serializeApplication({
          ...updatedApp,
          job: application.job,
        }),
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

// GET /api/v1/applications/:id/assessment/aptitude/chunk - Fetch progressive AI aptitude chunk
applicationRouter.get(
  '/:id/assessment/aptitude/chunk',
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

      const chunkIndex = Math.max(0, parseInt(req.query.chunkIndex as string, 10) || 0);
      const chunkSize = Math.max(1, Math.min(10, parseInt(req.query.chunkSize as string, 10) || 3));

      let assessment = await prisma.assessment.findFirst({
        where: { application_id: appId, test_type: 'aptitude' },
        orderBy: { created_at: 'desc' },
      });

      let existingQuestions: any[] = Array.isArray(assessment?.questions) ? (assessment!.questions as any[]) : [];
      const startIndex = chunkIndex * chunkSize;
      const targetCount = startIndex + chunkSize;

      if (existingQuestions.length >= targetCount) {
        const chunkQuestions = existingQuestions.slice(startIndex, targetCount).map((q: any) => ({
          id: q.id,
          category: q.category || 'Logical Reasoning',
          question: q.question || q.text,
          text: q.question || q.text,
          options: q.options || [],
          difficulty: q.difficulty || 'medium',
        }));

        return res.json({
          success: true,
          data: {
            assessmentId: assessment?.id,
            chunkIndex,
            chunkSize,
            questions: chunkQuestions,
            hasMore: true,
          },
        });
      }

      const previousStems = existingQuestions.map((q: any) => q.question || q.text || '');
      const thresholds = (app.job?.thresholds as any) || {};

      const newChunk = await generateAptitudeChunk({
        jobTitle: app.job?.title || 'Software Engineer',
        jobDescription: app.job?.description || '',
        difficulty: thresholds.difficulty || 'medium',
        chunkIndex,
        chunkSize,
        previousQuestions: previousStems,
      });

      const updatedQuestions = [...existingQuestions, ...newChunk];

      if (assessment) {
        assessment = await prisma.assessment.update({
          where: { id: assessment.id },
          data: { questions: updatedQuestions, status: 'in_progress' },
        });
      } else {
        assessment = await prisma.assessment.create({
          data: {
            application_id: appId,
            test_type: 'aptitude',
            questions: updatedQuestions,
            status: 'in_progress',
          },
        });
      }

      const sanitizedChunk = newChunk.map((q: any) => ({
        id: q.id,
        category: q.category || 'Logical Reasoning',
        question: q.question || q.text,
        text: q.question || q.text,
        options: q.options || [],
        difficulty: q.difficulty || 'medium',
      }));

      return res.json({
        success: true,
        data: {
          assessmentId: assessment.id,
          chunkIndex,
          chunkSize,
          questions: sanitizedChunk,
          hasMore: true,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/applications/:id/assessment/aptitude/chunk - Submit current chunk & fetch next chunk
applicationRouter.post(
  '/:id/assessment/aptitude/chunk',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;
      const { chunkIndex = 0, chunkSize = 3, answers = [] } = req.body;

      const app = await prisma.application.findUnique({
        where: { id: appId },
        include: { candidate: true, job: true },
      });

      if (!app || app.candidate.user_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }

      let assessment = await prisma.assessment.findFirst({
        where: { application_id: appId, test_type: 'aptitude' },
        orderBy: { created_at: 'desc' },
      });

      if (assessment) {
        const existingResponses = Array.isArray(assessment.responses) ? (assessment.responses as any[]) : [];
        const mergedResponses = [...existingResponses, ...(Array.isArray(answers) ? answers : [])];
        await prisma.assessment.update({
          where: { id: assessment.id },
          data: { responses: mergedResponses, status: 'in_progress' },
        });
      }

      const nextChunkIndex = Number(chunkIndex) + 1;
      const existingQuestions: any[] = Array.isArray(assessment?.questions) ? (assessment!.questions as any[]) : [];
      const previousStems = existingQuestions.map((q: any) => q.question || q.text || '');
      const thresholds = (app.job?.thresholds as any) || {};

      const nextChunk = await generateAptitudeChunk({
        jobTitle: app.job?.title || 'Software Engineer',
        jobDescription: app.job?.description || '',
        difficulty: thresholds.difficulty || 'medium',
        chunkIndex: nextChunkIndex,
        chunkSize: Number(chunkSize),
        previousQuestions: previousStems,
      });

      const updatedQuestions = [...existingQuestions, ...nextChunk];
      if (assessment) {
        await prisma.assessment.update({
          where: { id: assessment.id },
          data: { questions: updatedQuestions },
        });
      }

      const sanitizedNextChunk = nextChunk.map((q: any) => ({
        id: q.id,
        category: q.category || 'Logical Reasoning',
        question: q.question || q.text,
        text: q.question || q.text,
        options: q.options || [],
        difficulty: q.difficulty || 'medium',
      }));

      return res.json({
        success: true,
        data: {
          currentChunkSubmitted: chunkIndex,
          nextChunkIndex,
          questions: sanitizedNextChunk,
          hasMore: true,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/applications/:id/assessment/aptitude - Fetch dynamic LLM aptitude test questions
applicationRouter.get(
  '/:id/assessment/aptitude',
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

      // Determine exact number of questions set by the employer
      const assessmentConfig = (app.job?.assessmentConfig as any) || {};
      const thresholds = (app.job?.thresholds as any) || {};
      const qCount = Math.max(1, Math.min(100, Number(assessmentConfig.mcqCount || thresholds.qCount) || 5));

      // Check if assessment already exists with the employer's set qCount
      let assessment = await prisma.assessment.findFirst({
        where: { application_id: appId, test_type: 'aptitude' },
        orderBy: { created_at: 'desc' },
      });

      let rawQuestions: any[] = [];

      if (assessment && Array.isArray(assessment.questions) && assessment.questions.length === qCount) {
        rawQuestions = assessment.questions as any[];
      } else {
        // Generate AI questions tailored to the job using Gemini directly
        rawQuestions = await generateAiAptitudeQuestions(
          app.job?.title || 'Software Engineer',
          app.job?.description || '',
          qCount
        );

        // Persist generated questions in DB Assessment record
        if (assessment) {
          assessment = await prisma.assessment.update({
            where: { id: assessment.id },
            data: { questions: rawQuestions, status: 'pending' },
          });
        } else {
          assessment = await prisma.assessment.create({
            data: {
              application_id: appId,
              test_type: 'aptitude',
              questions: rawQuestions,
              status: 'pending',
            },
          });
        }
      }

      // Strip correctIndex before returning to client to prevent answer leakage
      const sanitizedQuestions = rawQuestions.slice(0, qCount).map((q: any) => ({
        id: q.id,
        category: q.category || 'Logical Reasoning',
        question: q.question || q.text,
        text: q.question || q.text,
        options: q.options || [],
        difficulty: q.difficulty || 'medium',
      }));

      return res.json({
        success: true,
        data: {
          assessmentId: assessment?.id,
          questions: sanitizedQuestions,
        },
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

      // Update responses in Assessment table
      await prisma.assessment.updateMany({
        where: { application_id: appId, test_type: 'aptitude' },
        data: {
          responses: answers || [],
          status: 'in_progress',
        },
      }).catch(() => {});

      // Score the submission server-side against the persisted questions (which
      // carry correctIndex) so the client gets a real result immediately instead
      // of a fabricated 0%. The async job still runs for the full pipeline.
      const storedAssessment = await prisma.assessment.findFirst({
        where: { application_id: appId, test_type: 'aptitude' },
        orderBy: { created_at: 'desc' },
      });
      const storedQuestions = Array.isArray(storedAssessment?.questions)
        ? (storedAssessment!.questions as Array<{ id?: string; correctIndex?: unknown }>)
        : [];
      const answersArr = Array.isArray(answers)
        ? (answers as Array<{ questionId?: string; selectedOption?: unknown }>)
        : [];
      const answerMap = new Map(answersArr.map((a) => [a.questionId, a.selectedOption]));
      let correctCount = 0;
      let totalScored = 0;
      for (const q of storedQuestions) {
        if (typeof q.correctIndex !== 'number') continue;
        totalScored++;
        if (answerMap.get(q.id) === q.correctIndex) correctCount++;
      }
      const computedScore = totalScored > 0 ? Math.round((correctCount / totalScored) * 100) : null;

      // Enqueue assessment scoring job in BullMQ
      await enqueueAssessment(appId, answers || [], { totalTimeSeconds, tabSwitchCount });

      return res.json({
        success: true,
        score: computedScore,
        correctAnswers: correctCount,
        totalQuestions: totalScored,
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

      const jobTitle = app.job?.title || 'Software Engineer';
      const jobDescription = app.job?.description || '';
      const jobConfig = (app.job?.thresholds as any) || {};
      const difficulty = jobConfig.difficulty || 'medium';

      const problem = await generateAiCodingProblem(jobTitle, jobDescription, difficulty);

      // Strip hidden test cases before sending to candidate
      const sanitizedProblem = {
        ...problem,
        testCases: (problem.testCases || []).filter((tc: any) => !tc.hidden),
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
        include: { candidate: true, job: true },
      });

      if (!app || app.candidate.user_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      }

      const jobTitle = app.job?.title || 'Software Engineer';
      const jobConfig = (app.job?.thresholds as any) || {};
      const currentProblem = await generateAiCodingProblem(jobTitle, app.job?.description || '', jobConfig.difficulty || 'medium');
      const testCasesToRun = currentProblem.testCases || [];

      const execSummary = executeCodingSubmission(code || '', language || 'python', testCasesToRun);

      const submission = await prisma.codingSubmission.create({
        data: {
          application_id: appId,
          code: code || '',
          language: language || 'python',
          status: execSummary.allPassed ? 'passed' : 'failed',
          test_results: JSON.parse(JSON.stringify({
            status: execSummary.allPassed ? 'passed' : 'failed',
            passRate: execSummary.passRate,
            results: execSummary.results,
            logs: execSummary.logs,
            ai_feedback: execSummary.allPassed ? 'All test cases passed cleanly!' : `${execSummary.passRate}% pass rate achieved.`,
          })),
          pass_rate: execSummary.passRate,
          pass_rate_percent: execSummary.passRate,
          pass_rate_ratio: execSummary.passRateRatio,
        },
      });

      // Update application evaluation score
      await prisma.evaluation.upsert({
        where: { application_id: appId },
        create: {
          application_id: appId,
          stage: 'assessment',
          coding_score: execSummary.passRate,
          reasoning: `Candidate achieved ${execSummary.passRate}% pass rate on coding assessment. Pending recruiter evaluation.`,
        },
        update: {
          coding_score: execSummary.passRate,
          reasoning: `Candidate achieved ${execSummary.passRate}% pass rate on coding assessment. Pending recruiter evaluation.`,
        },
      });

      return res.json({
        success: true,
        data: {
          submissionId: submission.id,
          status: submission.status,
          passRate: execSummary.passRate,
          results: execSummary.results,
        },
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
        where: { magic_link_token: token },
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
          candidate: { include: { user: { select: { email: true } } } },
          job: { include: { organization: { select: { name: true, logo_url: true } } } },
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
        data: serializeOffer(application.offer, application),
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/applications/:id/offer/sign - Digitally sign offer
// Auth: authenticated candidate owner OR a valid magic_link_token (from the emailed link)
applicationRouter.post(
  '/:id/offer/sign',
  optionalAuthenticate,
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
          where: { magic_link_token },
        });
      }

      if (!offer) {
        return res.status(404).json({ success: false, error: 'Offer not found for application' });
      }

      // Authorization: only the owning candidate or a valid magic link token may sign.
      const isOwner =
        req.user?.role === 'candidate' && (await candidateOwnsApplication(offer.application_id, req.user.userId));
      const tokenValid =
        typeof magic_link_token === 'string' &&
        magic_link_token.length > 0 &&
        offer.magic_link_token === magic_link_token;

      if (!isOwner && !tokenValid) {
        return res.status(403).json({ success: false, error: 'Forbidden: offer ownership could not be verified' });
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

// POST /api/v1/applications/:id/offer/decline - Candidate declines offer
// Auth: authenticated candidate owner OR a valid magic_link_token (from the emailed link)
applicationRouter.post(
  '/:id/offer/decline',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.id as string;
      const { reason, magic_link_token } = req.body;

      let offer = await prisma.offer.findUnique({
        where: { application_id: appId },
      });

      if (!offer && magic_link_token) {
        offer = await prisma.offer.findFirst({
          where: { magic_link_token },
        });
      }

      if (!offer) {
        return res.status(404).json({ success: false, error: 'Offer not found for application' });
      }

      // Authorization: only the owning candidate or a valid magic link token may decline.
      const isOwner =
        req.user?.role === 'candidate' && (await candidateOwnsApplication(offer.application_id, req.user.userId));
      const tokenValid =
        typeof magic_link_token === 'string' &&
        magic_link_token.length > 0 &&
        offer.magic_link_token === magic_link_token;

      if (!isOwner && !tokenValid) {
        return res.status(403).json({ success: false, error: 'Forbidden: offer ownership could not be verified' });
      }

      // Decline offer and update application to rejected
      const updatedOffer = await prisma.offer.update({
        where: { id: offer.id },
        data: {
          status: 'declined',
          offer_letter_content: reason
            ? `Declined reason: ${reason}\n${offer.offer_letter_content ?? ''}`
            : offer.offer_letter_content,
        },
      });

      await prisma.application.update({
        where: { id: offer.application_id },
        data: { status: 'rejected' },
      });

      return res.json({
        success: true,
        data: { offer: updatedOffer, status: 'declined' },
      });
    } catch (err) {
      return next(err);
    }
  }
);

