import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { serializeApplicationList } from '../../lib/serializers';

export async function getJobPipeline(req: Request, res: Response, next: NextFunction) {
  try {
    const jobId = req.params.id as string;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
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
  } catch (error) {
    return next(error);
  }
}

export async function getJobApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const jobId = req.params.id as string;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
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
  } catch (error) {
    return next(error);
  }
}
