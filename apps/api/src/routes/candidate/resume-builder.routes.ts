import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { ResumeBuilderSessionCreateSchema } from '@nextround/shared';
import { enqueueResumeBuilder } from '../../lib/queues/resume-builder.queue';
import { getCandidateProfileId } from '../../lib/candidate-profile';

export const resumeBuilderRouter = Router();

// GET /api/v1/resume-builder/history - Fetch past generated resume sessions for candidate
resumeBuilderRouter.get(
  '/history',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = await getCandidateProfileId(req.user!.userId);
      const sessions = await prisma.mockSession.findMany({
        where: {
          candidate_id: candidateId,
          type: 'resume_builder',
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 20,
      });

      return res.json({
        success: true,
        data: {
          history: sessions.map(s => ({
            id: s.id,
            targetRole: s.target_role,
            targetCompany: s.target_company,
            status: s.status,
            generatedResume: s.generated_resume,
            resumePdfUrl: s.resume_pdf_url,
            createdAt: s.created_at,
            endedAt: s.ended_at,
          })),
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/resume-builder/sessions - Start AI Voice Resume Builder Session
resumeBuilderRouter.post(
  '/sessions',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = ResumeBuilderSessionCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid payload' });
      }

      const candidateId = await getCandidateProfileId(req.user!.userId);
      const { targetRole, targetCompany, existingResumeText, careerGoals } = parsed.data;

      const session = await prisma.mockSession.create({
        data: {
          candidate_id: candidateId,
          type: 'resume_builder',
          status: 'active',
          target_role: targetRole,
          target_company: targetCompany || 'Target Enterprise',
          focus_areas: careerGoals ? [careerGoals] : [],
          rubric: existingResumeText ? { rawText: existingResumeText } : {},
        },
      });

      return res.status(201).json({
        success: true,
        data: {
          sessionId: session.id,
          session,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/resume-builder/:sessionId - Fetch session status & details
resumeBuilderRouter.get(
  '/:sessionId',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = await getCandidateProfileId(req.user!.userId);
      const session = await prisma.mockSession.findFirst({
        where: {
          id: req.params.sessionId as string,
          candidate_id: candidateId,
          type: 'resume_builder',
        },
      });

      if (!session) {
        return res.status(404).json({ success: false, error: 'Resume builder session not found' });
      }

      return res.json({
        success: true,
        data: { session },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/resume-builder/:sessionId/end - End session and enqueue PDF generation worker
resumeBuilderRouter.post(
  '/:sessionId/end',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = await getCandidateProfileId(req.user!.userId);
      const session = await prisma.mockSession.findFirst({
        where: {
          id: req.params.sessionId as string,
          candidate_id: candidateId,
          type: 'resume_builder',
        },
      });

      if (!session) {
        return res.status(404).json({ success: false, error: 'Resume builder session not found' });
      }

      const updated = await prisma.mockSession.update({
        where: { id: session.id },
        data: {
          status: 'scoring',
          ended_at: new Date(),
          transcript: req.body.transcript || session.transcript || [],
        },
      });

      await enqueueResumeBuilder(
        updated.id,
        candidateId,
        updated.transcript,
        updated.target_role,
        updated.target_company
      );

      return res.json({
        success: true,
        data: { session: updated, status: 'scoring' },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/resume-builder/:sessionId/result - Get generated resume JSON & PDF download URL
resumeBuilderRouter.get(
  '/:sessionId/result',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = await getCandidateProfileId(req.user!.userId);
      const session = await prisma.mockSession.findFirst({
        where: {
          id: req.params.sessionId as string,
          candidate_id: candidateId,
          type: 'resume_builder',
        },
      });

      if (!session) {
        return res.status(404).json({ success: false, error: 'Resume builder session not found' });
      }

      return res.json({
        success: true,
        data: {
          sessionId: session.id,
          status: session.status,
          generatedResume: session.generated_resume,
          resumePdfUrl: session.resume_pdf_url,
          transcript: session.transcript,
          createdAt: session.created_at,
          endedAt: session.ended_at,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);
