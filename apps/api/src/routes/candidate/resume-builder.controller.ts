import { Request, Response, NextFunction } from 'express';
import { prisma } from '@nextround/database';
import { getCandidateProfileId } from '../../lib/candidate-profile';

export async function listResumeHistory(req: Request, res: Response, next: NextFunction) {
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
        history: sessions.map((sessionItem) => ({
          id: sessionItem.id,
          targetRole: sessionItem.target_role,
          targetCompany: sessionItem.target_company,
          status: sessionItem.status,
          generatedResume: sessionItem.generated_resume,
          resumePdfUrl: sessionItem.resume_pdf_url,
          createdAt: sessionItem.created_at,
          endedAt: sessionItem.ended_at,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getResumeResult(req: Request, res: Response, next: NextFunction) {
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
  } catch (error) {
    return next(error);
  }
}

export async function deleteResumeSession(req: Request, res: Response, next: NextFunction) {
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

    await prisma.mockSession.delete({
      where: { id: session.id },
    });

    return res.json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
}
