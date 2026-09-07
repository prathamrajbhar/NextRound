import { Request, Response, NextFunction } from 'express';
import { JobCreateSchema, JobUpdateSchema } from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@nextround/database';
import type { JobStatus } from '@nextround/database';
import { logger } from '../../lib/logger';
import { enqueueSourcing } from '../../lib/queues/sourcing.queue';
import { serializeJob } from '../../lib/serializers';

export async function createJob(req: Request, res: Response, next: NextFunction) {
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
        rubric: defaultRubric as Prisma.InputJsonValue,
        thresholds: defaultThresholds as Prisma.InputJsonValue,
        status: (validated.status || 'draft') as JobStatus,
        location: validated.location || null,
        salary: validated.salary || null,
        experienceLevel: validated.experienceLevel || null,
        department: validated.department || null,
        skills: (validated.skills || []) as string[],
        stages: (validated.stages || undefined) as Prisma.InputJsonValue,
        assessmentConfig: (validated.assessmentConfig || undefined) as Prisma.InputJsonValue,
      },
    });

    return res.status(201).json({
      success: true,
      data: serializeJob(newJob),
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateJob(req: Request, res: Response, next: NextFunction) {
  try {
    const jobId = req.params.id as string;

    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
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
        ...(validated.rubric && { rubric: validated.rubric as Prisma.InputJsonValue }),
        ...(validated.thresholds && { thresholds: validated.thresholds as Prisma.InputJsonValue }),
        ...(validated.status && { status: validated.status as JobStatus }),
        ...(validated.location !== undefined && { location: validated.location ?? null }),
        ...(validated.salary !== undefined && { salary: validated.salary ?? null }),
        ...(validated.experienceLevel !== undefined && { experienceLevel: validated.experienceLevel ?? null }),
        ...(validated.skills && { skills: validated.skills as string[] }),
        ...(validated.stages && { stages: validated.stages as Prisma.InputJsonValue }),
        ...(validated.assessmentConfig && { assessmentConfig: validated.assessmentConfig as Prisma.InputJsonValue }),
        ...(validated.department !== undefined && { department: validated.department ?? null }),
      },
    });

    return res.json({
      success: true,
      data: serializeJob(updatedJob),
    });
  } catch (error) {
    return next(error);
  }
}

export async function publishJob(req: Request, res: Response, next: NextFunction) {
  try {
    const jobId = req.params.id as string;

    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
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

    try {
      await enqueueSourcing(updatedJob.id, 'sourcing_index', {
        orgId: updatedJob.org_id,
        timestamp: new Date().toISOString(),
      });
    } catch (queueErr) {
      logger.child('Jobs').error(`Failed to enqueue sourcing job for job ${updatedJob.id}:`, queueErr);
    }

    return res.json({
      success: true,
      data: { job: updatedJob, message: 'Job published successfully and sourcing agent queued' },
    });
  } catch (error) {
    return next(error);
  }
}

export async function closeJob(req: Request, res: Response, next: NextFunction) {
  try {
    const jobId = req.params.id as string;

    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
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
  } catch (error) {
    return next(error);
  }
}

export async function deleteJob(req: Request, res: Response, next: NextFunction) {
  try {
    const jobId = req.params.id as string;

    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
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
  } catch (error) {
    return next(error);
  }
}
