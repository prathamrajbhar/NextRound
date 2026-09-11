import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import type { JobStatus } from '@nextround/database';
import { serializeJob, serializeJobList } from '../../lib/serializers';

export async function listJobs(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user && req.user.role === 'hr' && req.user.orgId) {
      const { status } = req.query;
      const statusFilter = status && typeof status === 'string' ? status : undefined;

      const statusWhere = statusFilter === 'active'
        ? { status: { in: ['active', 'published'] as JobStatus[] } }
        : statusFilter
        ? { status: statusFilter as JobStatus }
        : { status: { not: 'deleted' as JobStatus } };

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

    const jobs = await prisma.job.findMany({
      where: {
        status: { in: ['published', 'active'] as JobStatus[] },
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
  } catch (error) {
    return next(error);
  }
}

export async function listOrgJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.orgId!;
    const { status } = req.query;
    const statusFilter = status && typeof status === 'string' ? status : undefined;

    const statusWhere = statusFilter === 'active'
      ? { status: { in: ['active', 'published'] as JobStatus[] } }
      : statusFilter
      ? { status: statusFilter as JobStatus }
      : { status: { not: 'deleted' as JobStatus } };

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
  } catch (error) {
    return next(error);
  }
}

export async function getJob(req: Request, res: Response, next: NextFunction) {
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

    if (req.user && req.user.role === 'hr') {
      if (job.org_id !== req.user.orgId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Access denied to job' });
      }
    } else {
      if (job.status !== 'published' && job.status !== 'active') {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }
    }

    return res.json({
      success: true,
      data: serializeJob(job),
    });
  } catch (error) {
    return next(error);
  }
}
