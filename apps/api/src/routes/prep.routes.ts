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

    // Default response structure if no custom prep content has been generated yet
    const data = prepContent || {
      company_name: job.organization.name,
      role_archetype: job.title,
      questions: [
        {
          dimension: 'System Architecture',
          question: `How would you architect a distributed fault-tolerant backend system for ${job.organization.name}?`,
          suggestedAnswerKey: 'Emphasize horizontal scalability, load balancing, caching tiers, and DB sharding.',
        },
        {
          dimension: 'Problem Solving & Algorithms',
          question: 'Walk through an algorithmic optimization that reduced runtime complexity from O(N^2) to O(N log N).',
          suggestedAnswerKey: 'Focus on sorting algorithms, hash maps, binary search, or two-pointer patterns.',
        },
        {
          dimension: 'Behavioral & Leadership',
          question: 'Describe a situation where you resolved a major production outage under tight deadline pressure.',
          suggestedAnswerKey: 'Use STAR format: Situation, Task, Action (monitoring/rollback), Result (SLA maintained).',
        },
        {
          dimension: 'Technical Excellence',
          question: 'How do you approach writing clean, testable, and maintainable production software?',
          suggestedAnswerKey: 'Discuss unit testing, CI/CD pipelines, strict typing, and domain-driven design principles.',
        },
      ],
      culture_notes: `Key values at ${job.organization.name}: Customer obsession, zero-latency execution, transparency, and continuous technical innovation.`,
      skill_checklist: ['System Architecture', 'Algorithmic Optimization', 'CI/CD & Testing', 'Cross-functional Communication'],
    };

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
