import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

export const prepRouter = Router();

// GET /api/v1/prep/jobs/:jobId - Get prep content for specific job
prepRouter.get('/jobs/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId as string;
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, title: true, description: true, org_id: true, organization: { select: { name: true } } },
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    let prepContent = await prisma.prepContent.findFirst({
      where: { job_id: jobId },
    });

    if (!prepContent) {
      prepContent = await prisma.prepContent.findFirst({
        where: { company_name: job.organization.name },
      });
    }

    // Return null when no prep content has been generated yet (no fabricated content).
    const data = prepContent || null;

    return res.json({
      success: true,
      data: { job, prepContent: data },
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/v1/prep/:orgId - Get company-wide prep content
prepRouter.get('/:orgId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.params.orgId as string;
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, industry: true },
    });

    if (!org) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    const prepContents = await prisma.prepContent.findMany({
      where: {
        OR: [
          { org_id: orgId },
          { company_name: org.name },
        ],
      },
    });

    return res.json({
      success: true,
      data: {
        organization: org,
        prepContents,
      },
    });
  } catch (err) {
    return next(err);
  }
});
