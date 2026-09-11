import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { serializeOffer } from '../../lib/serializers';
import { advanceAssessmentStage } from '../../lib/pipeline';

export async function getApplicationOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const appId = req.params.id as string;

    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        offer: true,
        candidate: { include: { user: { select: { email: true } } } },
        job: {
          include: { organization: true },
        },
      },
    });

    if (!application || application.candidate.user_id !== req.user!.userId) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (!application.offer) {
      return res.status(404).json({ success: false, error: 'No offer found for application' });
    }

    return res.json({
      success: true,
      data: serializeOffer(application.offer, application),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getApplicationTakeHome(req: Request, res: Response, next: NextFunction) {
  try {
    const appId = req.params.id as string;

    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        candidate: { include: { user: true } },
        job: true,
      },
    });

    if (!application || application.candidate.user_id !== req.user!.userId) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.status === 'applied' || application.status === 'screening') {
      return res.status(404).json({ success: false, error: 'Take-home project is not active for this application stage' });
    }

    const candidateName = application.candidate.user.email.split('@')[0];
    const assignedDate = application.applied_at.toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const takeHomeProject = {
      id: `project-${application.id}`,
      applicationId: application.id,
      candidateName,
      title: `Technical Assessment: ${application.job.title}`,
      description: 'Build a production-ready reactive dashboard showcasing state management, clean component modularity, strict error handling, and unit test coverage.',
      status: 'assigned' as const,
      assignedDate,
      dueDate,
      rubric: [
        { criterion: 'Architecture & File Structure', weight: 30 },
        { criterion: 'TypeScript Strictness & Code Quality', weight: 25 },
        { criterion: 'UI Design & Accessibility', weight: 25 },
        { criterion: 'Automated Test Coverage', weight: 20 },
      ],
    };

    return res.json({
      success: true,
      data: takeHomeProject,
    });
  } catch (error) {
    return next(error);
  }
}

export async function submitApplicationTakeHome(req: Request, res: Response, next: NextFunction) {
  try {
    const appId = req.params.id as string;
    const { repoUrl, comments } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ success: false, error: 'repoUrl is required' });
    }

    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: { candidate: true },
    });

    if (!application || application.candidate.user_id !== req.user!.userId) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    await prisma.application.update({
      where: { id: appId },
      data: { status: 'screening_completed' },
    });

    await advanceAssessmentStage(appId).catch((error) =>
      logger.child('CandidateApps').error(`Failed to advance assessment stage for application ${appId}:`, error)
    );

    return res.json({
      success: true,
      data: { message: 'Take-home assignment submitted for HR evaluation', repoUrl, comments },
    });
  } catch (error) {
    return next(error);
  }
}
