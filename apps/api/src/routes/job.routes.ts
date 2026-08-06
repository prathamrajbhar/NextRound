import { Router, Request, Response, NextFunction } from 'express';
import { JobCreateSchema, JobUpdateSchema } from '@nextround/shared';
import { prisma } from '../lib/prisma';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireOrgScope } from '../middleware/orgScope';
import { enqueueSourcing } from '../lib/queues/sourcing.queue';

export const jobRouter = Router();

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

// POST /api/v1/jobs - HR create draft job
jobRouter.post(
  '/',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;

      const validated = JobCreateSchema.parse(req.body);
      const orgId = req.user!.orgId!;

      const defaultRubric = validated.rubric || {
        technical: 25,
        communication: 25,
        problemSolving: 25,
        experience: 25,
      };

      const defaultThresholds = validated.thresholds || {
        minScore: 70,
        autoOffer: false,
      };

      const newJob = await prisma.job.create({
        data: {
          org_id: orgId,
          title: validated.title,
          description: validated.description,
          rubric: defaultRubric as any,
          thresholds: defaultThresholds as any,
          status: 'draft',
        },
      });

      return res.status(201).json({
        success: true,
        data: { job: newJob },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/jobs - List jobs (Public or HR org-scoped)
jobRouter.get(
  '/',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;

      // HR user: list jobs in their organization
      if (req.user && req.user.role === 'hr' && req.user.orgId) {
        const { status } = req.query;
        const statusFilter = status && typeof status === 'string' ? status : undefined;

        const jobs = await prisma.job.findMany({
          where: {
            org_id: req.user.orgId,
            ...(statusFilter ? { status: statusFilter as any } : { status: { not: 'deleted' as any } }),
          },
          orderBy: { created_at: 'desc' },
          include: {
            _count: {
              select: { applications: true },
            },
          },
        });

        return res.json({
          success: true,
          data: { jobs },
        });
      }

      // Public / candidate: list active/published jobs
      const jobs = await prisma.job.findMany({
        where: {
          status: { in: ['published', 'active'] as any },
        },
        orderBy: { created_at: 'desc' },
        include: {
          organization: {
            select: { id: true, name: true, logo_url: true, industry: true },
          },
        },
      });

      return res.json({
        success: true,
        data: { jobs },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/jobs/:id - Single job details
jobRouter.get(
  '/:id',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const jobId = req.params.id as string;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          organization: {
            select: { id: true, name: true, logo_url: true, industry: true },
          },
          _count: {
            select: { applications: true },
          },
        },
      });

      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      // If HR user, ensure org isolation
      if (req.user && req.user.role === 'hr') {
        if (job.org_id !== req.user.orgId) {
          return res.status(403).json({ success: false, error: 'Forbidden: Access denied to job' });
        }
      } else {
        // Public/candidate access only for published/active jobs
        if (job.status !== 'published' && job.status !== 'active') {
          return res.status(404).json({ success: false, error: 'Job not found' });
        }
      }

      return res.json({
        success: true,
        data: { job },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /api/v1/jobs/:id - HR update job draft / details
jobRouter.patch(
  '/:id',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const jobId = req.params.id as string;

      const existingJob = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!existingJob) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      if (existingJob.org_id !== req.user!.orgId!) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied to job' });
      }

      const validated = JobUpdateSchema.parse(req.body);

      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          ...(validated.title && { title: validated.title }),
          ...(validated.description && { description: validated.description }),
          ...(validated.rubric && { rubric: validated.rubric as any }),
          ...(validated.thresholds && { thresholds: validated.thresholds as any }),
          ...(validated.status && { status: validated.status as any }),
        },
      });

      return res.json({
        success: true,
        data: { job: updatedJob },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/jobs/:id/publish - HR publish job & enqueue sourcing agent
jobRouter.post(
  '/:id/publish',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const jobId = req.params.id as string;

      const existingJob = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!existingJob) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      if (existingJob.org_id !== req.user!.orgId!) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied to job' });
      }

      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: { status: 'published' },
      });

      // Enqueue sourcing queue job for auto-sourcing & indexing
      try {
        await enqueueSourcing(updatedJob.id, 'sourcing_index', {
          orgId: updatedJob.org_id,
          timestamp: new Date().toISOString(),
        });
      } catch (queueErr) {
        console.error('Failed to enqueue sourcing job:', queueErr);
      }

      return res.json({
        success: true,
        data: { job: updatedJob, message: 'Job published successfully and sourcing agent queued' },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/jobs/:id/close - HR close job
jobRouter.post(
  '/:id/close',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const jobId = req.params.id as string;

      const existingJob = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!existingJob) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      if (existingJob.org_id !== req.user!.orgId!) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied to job' });
      }

      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: { status: 'closed' },
      });

      return res.json({
        success: true,
        data: { job: updatedJob, message: 'Job closed successfully' },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// DELETE /api/v1/jobs/:id - HR soft delete job
jobRouter.delete(
  '/:id',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const jobId = req.params.id as string;

      const existingJob = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!existingJob) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      if (existingJob.org_id !== req.user!.orgId!) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied to job' });
      }

      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'deleted' },
      });

      return res.json({
        success: true,
        data: { message: 'Job deleted successfully' },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/jobs/:id/ai-assist - Enqueue JD parsing / AI assist job
jobRouter.post(
  '/:id/ai-assist',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const jobId = req.params.id as string;

      const existingJob = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!existingJob) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      if (existingJob.org_id !== req.user!.orgId!) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied to job' });
      }

      await enqueueSourcing(existingJob.id, 'ai-jd-assist', {
        orgId: existingJob.org_id,
        description: existingJob.description,
        timestamp: new Date().toISOString(),
      });

      return res.json({
        success: true,
        data: { message: 'AI assistance task queued successfully' },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/jobs/:id/pipeline - Kanban stage breakdown
jobRouter.get(
  '/:id/pipeline',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const jobId = req.params.id as string;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job || job.org_id !== req.user!.orgId!) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied to job pipeline' });
      }

      const applications = await prisma.application.findMany({
        where: { job_id: jobId },
        include: {
          candidate: {
            include: {
              user: { select: { email: true } },
            },
          },
          evaluations: true,
          interview: true,
        },
        orderBy: { applied_at: 'desc' },
      });

      // Group applications by status for Kanban board
      const pipeline: Record<string, typeof applications> = {
        applied: [],
        screening: [],
        screening_completed: [],
        assessment: [],
        interview_scheduled: [],
        interviewed: [],
        evaluation: [],
        hr_round: [],
        decided: [],
        offered: [],
        accepted: [],
        rejected: [],
        withdrawn: [],
      };

      applications.forEach((app) => {
        const key = app.status as string;
        if (!pipeline[key]) {
          pipeline[key] = [];
        }
        pipeline[key].push(app);
      });

      return res.json({
        success: true,
        data: {
          jobId,
          totalApplications: applications.length,
          pipeline,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/jobs/:id/applications - List applications for job
jobRouter.get(
  '/:id/applications',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkOrgParamPollution(req, res)) return;
      const jobId = req.params.id as string;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job || job.org_id !== req.user!.orgId!) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied to job applications' });
      }

      const applications = await prisma.application.findMany({
        where: { job_id: jobId },
        include: {
          candidate: {
            include: {
              user: { select: { email: true } },
            },
          },
          evaluations: true,
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
