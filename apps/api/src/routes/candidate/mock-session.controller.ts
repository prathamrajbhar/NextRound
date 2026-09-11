import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { MockSessionCreateSchema } from '@nextround/shared';
import { serializeMockSession, serializeMockSessionList } from '../../lib/serializers';
import { getCandidateProfileId } from '../../lib/candidate-profile';

export async function getTopics(_req: Request, res: Response) {
  const topics = [
    { id: 'system-design', name: 'System Design & Architecture', category: 'technical', icon: 'Cpu' },
    { id: 'data-structures', name: 'Data Structures & Algorithms', category: 'coding', icon: 'Code' },
    { id: 'behavioral', name: 'Behavioral & STAR Method', category: 'behavioral', icon: 'UserCheck' },
    { id: 'sql-databases', name: 'Database & SQL Optimization', category: 'technical', icon: 'Database' },
    { id: 'frontend-react', name: 'Frontend Architecture & React', category: 'technical', icon: 'Layers' },
    { id: 'devops-cloud', name: 'DevOps, CI/CD & Kubernetes', category: 'technical', icon: 'Cloud' },
  ];
  return res.json({ success: true, data: { topics } });
}

export async function createMockSession(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = MockSessionCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid payload' });
    }

    const candidateId = await getCandidateProfileId(req.user!.userId);
    const { topic, targetCompany, targetRole, difficulty, focusAreas } = parsed.data;

    if (!targetRole && !topic) {
      return res.status(400).json({
        success: false,
        error: 'A target role or practice topic is required to start a mock session.',
      });
    }

    const mockSession = await prisma.mockSession.create({
      data: {
        candidate_id: candidateId,
        target_company: targetCompany || '',
        target_role: targetRole || '',
        topic: topic,
        difficulty: difficulty,
        type: 'mock',
        status: 'active',
        focus_areas: focusAreas || [],
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        sessionId: mockSession.id,
        startsAt: mockSession.created_at.toISOString(),
        session: mockSession,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function listMockSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const candidateId = await getCandidateProfileId(req.user!.userId);
    const sessions = await prisma.mockSession.findMany({
      where: {
        candidate_id: candidateId,
        type: 'mock',
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({
      success: true,
      data: serializeMockSessionList(sessions),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMockSession(req: Request, res: Response, next: NextFunction) {
  try {
    const candidateId = await getCandidateProfileId(req.user!.userId);
    const session = await prisma.mockSession.findFirst({
      where: {
        id: req.params.id as string,
        candidate_id: candidateId,
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Mock session not found' });
    }

    return res.json({
      success: true,
      data: { session: serializeMockSession(session) },
    });
  } catch (error) {
    return next(error);
  }
}
