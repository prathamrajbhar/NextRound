import { Router, Request, Response, NextFunction } from 'express';
import { JobCreateSchema, JobUpdateSchema } from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope, rejectOrgIdParam } from '../../middleware/orgScope';
import { enqueueSourcing } from '../../lib/queues/sourcing.queue';
import {
  serializeJob,
  serializeJobList,
  serializeApplicationList,
} from '../../lib/serializers';
import { extractRequirementsFromJd } from '../../services/jd-extractor.service';

export const jobRouter = Router();

// Org scoping is JWT-derived; never accept a client-supplied org_id.
jobRouter.use(rejectOrgIdParam);

// POST /api/v1/jobs - HR create draft job
jobRouter.post(
  '/',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {

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
          status: validated.status || 'draft',
          location: validated.location || null,
          salary: validated.salary || null,
          experienceLevel: validated.experienceLevel || null,
          department: validated.department || null,
          skills: (validated.skills || []) as any,
          stages: (validated.stages || null) as any,
          assessmentConfig: (validated.assessmentConfig || null) as any,
        },
      });

      return res.status(201).json({
        success: true,
        data: serializeJob(newJob),
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/jobs - List jobs (Authenticated candidate or HR org-scoped)
jobRouter.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {

      // HR user: list jobs in their organization
      if (req.user && req.user.role === 'hr' && req.user.orgId) {
        const { status } = req.query;
        const statusFilter = status && typeof status === 'string' ? status : undefined;

        const statusWhere = statusFilter === 'active'
          ? { status: { in: ['active', 'published'] as any } }
          : statusFilter
          ? { status: statusFilter as any }
          : { status: { not: 'deleted' as any } };

        const jobs = await prisma.job.findMany({
          where: {
            org_id: req.user.orgId,
            ...statusWhere,
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
          data: serializeJobList(jobs),
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
        data: serializeJobList(jobs),
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/jobs/org - HR list jobs in their organization (registered before /:id)
jobRouter.get(
  '/org',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.orgId!;
      const { status } = req.query;
      const statusFilter = status && typeof status === 'string' ? status : undefined;

      const statusWhere = statusFilter === 'active'
        ? { status: { in: ['active', 'published'] as any } }
        : statusFilter
        ? { status: statusFilter as any }
        : { status: { not: 'deleted' as any } };

      const jobs = await prisma.job.findMany({
        where: {
          org_id: orgId,
          ...statusWhere,
        },
        orderBy: { created_at: 'desc' },
        include: {
          organization: {
            select: { id: true, name: true, logo_url: true },
          },
          _count: {
            select: { applications: true },
          },
        },
      });

      return res.json({
        success: true,
        data: serializeJobList(jobs),
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/jobs/:id - Single job details (Authenticated candidate or HR org-scoped)
jobRouter.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        data: serializeJob(job),
      });
    } catch (err) {
      return next(err);
    }
  }
);

async function handleJobUpdate(req: Request, res: Response, next: NextFunction) {
  try {
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
        ...(validated.location !== undefined && { location: validated.location ?? null }),
        ...(validated.salary !== undefined && { salary: validated.salary ?? null }),
        ...(validated.experienceLevel !== undefined && { experienceLevel: validated.experienceLevel ?? null }),
        ...(validated.skills && { skills: validated.skills as any }),
        ...(validated.stages && { stages: validated.stages as any }),
        ...(validated.assessmentConfig && { assessmentConfig: validated.assessmentConfig as any }),
        ...(validated.department !== undefined && { department: validated.department ?? null }),
      },
    });

    return res.json({
      success: true,
      data: serializeJob(updatedJob),
    });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/v1/jobs/:id - Update job fields
jobRouter.patch('/:id', authenticate, requireRole('hr'), requireOrgScope, handleJobUpdate);

// PUT /api/v1/jobs/:id - Alias for full job update
jobRouter.put('/:id', authenticate, requireRole('hr'), requireOrgScope, handleJobUpdate);

// POST /api/v1/jobs/:id/publish - HR publish job & enqueue sourcing agent
jobRouter.post(
  '/:id/publish',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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

// POST /api/v1/jobs/extract-requirements - Real-time AI extraction of skills, soft skills, culture, and rubric
jobRouter.post(
  '/extract-requirements',
  authenticate,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { description, title } = req.body;
      if (!description || typeof description !== 'string') {
        return res.status(400).json({ success: false, error: 'Job description is required' });
      }

      const extracted = await extractRequirementsFromJd(description, title);
      return res.json({
        success: true,
        data: extracted,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/jobs/:id/ai-assist - Enqueue JD parsing & run real-time AI assist
jobRouter.post(
  '/:id/ai-assist',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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

      const extracted = await extractRequirementsFromJd(existingJob.description, existingJob.title);

      // Save real extracted requirements directly to the job record
      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          skills: extracted.skills as any,
          rubric: extracted.rubric as any,
          ...(extracted.enhancedDescription ? { description: extracted.enhancedDescription } : {}),
        },
      });

      // Best effort background worker enqueue
      try {
        await enqueueSourcing(existingJob.id, 'ai-jd-assist', {
          orgId: existingJob.org_id,
          description: existingJob.description,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not enqueue sourcing worker:', err);
      }

      return res.json({
        success: true,
        data: {
          job: updatedJob,
          extracted,
          message: 'AI assistance executed and requirements extracted successfully',
        },
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
          job: {
            select: {
              id: true,
              title: true,
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

      return res.json({
        success: true,
        data: serializeApplicationList(applications),
      });
    } catch (err) {
      return next(err);
    }
  }
);
