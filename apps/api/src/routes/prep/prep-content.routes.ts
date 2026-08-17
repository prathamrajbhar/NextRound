import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope } from '../../middleware/orgScope';
import { enqueueSourcing } from '../../lib/queues/sourcing.queue';

export const prepRouter = Router();

prepRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company, role } = req.query;

    const where: Record<string, unknown> = {};
    if (company && typeof company === 'string') {
      where.company_name = { contains: company, mode: 'insensitive' };
    }
    if (role && typeof role === 'string') {
      where.role_archetype = { contains: role, mode: 'insensitive' };
    }

    const prepContents = await prisma.prepContent.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      take: 50,
      select: {
        id: true,
        company_name: true,
        role_archetype: true,
        questions: true,
        culture_notes: true,
        skill_checklist: true,
        updated_at: true,
      },
    });

    return res.json({
      success: true,
      data: { prepContents, total: prepContents.length },
    });
  } catch (err) {
    return next(err);
  }
});

prepRouter.post(
  '/generate',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.orgId!;
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({ success: false, error: 'jobId is required' });
      }

      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (!job || job.org_id !== orgId) {
        return res.status(404).json({ success: false, error: 'Job not found or access denied' });
      }

      await enqueueSourcing(jobId, 'prep-generate', {
        orgId,
        jobTitle: job.title,
        jobDescription: job.description,
        timestamp: new Date().toISOString(),
      });

      return res.json({
        success: true,
        data: { message: 'Prep content generation queued successfully', jobId },
      });
    } catch (err) {
      return next(err);
    }
  }
);

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

    const data = prepContent || null;

    return res.json({
      success: true,
      data: { job, prepContent: data },
    });
  } catch (err) {
    return next(err);
  }
});

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

