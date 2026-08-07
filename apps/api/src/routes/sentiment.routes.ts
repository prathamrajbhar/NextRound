import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

export const sentimentRouter = Router();

function rejectExplicitOrgId(req: Request, res: Response, next: NextFunction) {
  if ((req.body && req.body.org_id) || (req.query && req.query.org_id)) {
    return res.status(403).json({
      success: false,
      error: 'Security Error: org_id parameter is forbidden in request body/query. Scoped automatically by auth token.',
    });
  }
  next();
}

// ML_BYPASS: audio prosody/pitch analysis — upgrade to pyAudioAnalysis or wav2vec2 when available
// GET /api/v1/hr/sentiment/:interviewId - Get detailed sentiment & stress biomarker report for an interview
sentimentRouter.get(
  '/:interviewId',
  authenticate,
  requireRole('hr'),
  rejectExplicitOrgId,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const interviewId = req.params.interviewId as string;
      const orgId = req.user!.orgId;

      if (!orgId) {
        return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
      }

      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: {
          application: {
            include: {
              job: { select: { org_id: true, title: true } },
              candidate: {
                include: {
                  user: { select: { email: true } },
                },
              },
            },
          },
        },
      });

      if (!interview) {
        return res.status(404).json({ success: false, error: 'Interview record not found' });
      }

      // Security check: verify application job org_id matches auth user's org_id
      if (interview.application.job.org_id !== orgId) {
        return res.status(403).json({ success: false, error: 'Access denied: Interview belongs to another organization' });
      }

      if (!interview.sentiment_report) {
        return res.status(404).json({
          success: false,
          error: 'Sentiment report not yet available for this interview',
        });
      }

      const report = interview.sentiment_report;

      return res.json({
        success: true,
        data: {
          interviewId: interview.id,
          candidateEmail: interview.application.candidate.user.email,
          jobTitle: interview.application.job.title,
          sentimentReport: report,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);
