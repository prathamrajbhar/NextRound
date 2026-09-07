import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { buildProfile } from './sentiment.helpers';

export async function getSentimentProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.orgId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
    }

    const interviews = await prisma.interview.findMany({
      where: {
        status: 'completed',
        application: {
          job: { org_id: orgId },
        },
      },
      include: {
        application: {
          include: {
            candidate: {
              include: {
                user: { select: { email: true } },
              },
            },
            job: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const profiles = interviews.map(buildProfile);

    return res.json({
      success: true,
      data: { profiles },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getSentimentProfileById(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.orgId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
    }

    const interview = await prisma.interview.findFirst({
      where: {
        id: req.params.interviewId as string,
        status: 'completed',
        application: {
          job: { org_id: orgId },
        },
      },
      include: {
        application: {
          include: {
            candidate: {
              include: {
                user: { select: { email: true } },
              },
            },
            job: true,
          },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview sentiment data not found' });
    }

    const profile = buildProfile(interview);

    return res.json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    return next(error);
  }
}
