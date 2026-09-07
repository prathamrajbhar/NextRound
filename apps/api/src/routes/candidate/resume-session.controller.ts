import { Request, Response, NextFunction } from 'express';
import { prisma, Prisma } from '@nextround/database';
import { ResumeBuilderSessionCreateSchema } from '@nextround/shared';
import { enqueueResumeBuilder } from '../../lib/queues/resume-builder.queue';
import { getCandidateProfileId } from '../../lib/candidate-profile';
import { logger } from '../../lib/logger';

export async function createResumeSession(req: Request, res: Response, next: NextFunction) {
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
        rubric: (existingResumeText ? { rawText: existingResumeText } : {}) as Prisma.InputJsonValue,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        session,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getResumeSession(req: Request, res: Response, next: NextFunction) {
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
  } catch (error) {
    return next(error);
  }
}

export async function endResumeSession(req: Request, res: Response, next: NextFunction) {
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

    if (session.status !== 'active') {
      return res.json({
        success: true,
        data: { session, status: session.status },
      });
    }

    const updated = await prisma.mockSession.update({
      where: { id: session.id },
      data: {
        status: 'scoring',
        ended_at: new Date(),
        transcript: (req.body.transcript || session.transcript || []) as Prisma.InputJsonValue,
      },
    });

    try {
      await enqueueResumeBuilder(
        updated.id,
        candidateId,
        updated.transcript as unknown[],
        updated.target_role,
        updated.target_company
      );
    } catch (queueErr) {
      logger.child('ResumeBuilder').warn('BullMQ enqueue warning:', queueErr);
    }

    const aiServiceUrl = process.env.AI_BASE_URL || 'http://localhost:8000';
    fetch(`${aiServiceUrl}/api/v1/ai/interview/resume-builder/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: updated.id,
        targetRole: updated.target_role,
        targetCompany: updated.target_company,
        transcript: updated.transcript,
      }),
    }).catch((aiErr) => {
      logger.child('ResumeBuilder').warn('Direct AI service background trigger warning:', aiErr);
    });

    return res.json({
      success: true,
      data: { session: updated, status: 'scoring' },
    });
  } catch (error) {
    return next(error);
  }
}
