import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { MockSessionCreateSchema } from '@nextround/shared';
import { enqueueMockEvaluation } from '../../lib/queues/mock.queue';
import { serializeMockSession, serializeMockSessionList } from '../../lib/serializers';
import { generateAiAptitudeQuestions, generateAptitudeChunk } from '../../services/ai-question-generator.service';
import { generateAiCodingProblem } from '../../services/ai-coding-generator.service';
import { getCandidateProfileId } from '../../lib/candidate-profile';

export const mockRouter = Router();

// GET /api/v1/mock/topics - Get dynamic available topics
mockRouter.get('/topics', async (req: Request, res: Response) => {
  const topics = [
    { id: 'system-design', name: 'System Design & Architecture', category: 'technical', icon: 'Cpu' },
    { id: 'data-structures', name: 'Data Structures & Algorithms', category: 'coding', icon: 'Code' },
    { id: 'behavioral', name: 'Behavioral & STAR Method', category: 'behavioral', icon: 'UserCheck' },
    { id: 'sql-databases', name: 'Database & SQL Optimization', category: 'technical', icon: 'Database' },
    { id: 'frontend-react', name: 'Frontend Architecture & React', category: 'technical', icon: 'Layers' },
    { id: 'devops-cloud', name: 'DevOps, CI/CD & Kubernetes', category: 'technical', icon: 'Cloud' },
  ];
  return res.json({ success: true, data: { topics } });
});

// POST /api/v1/mock/sessions - Create new mock interview session
mockRouter.post(
  '/sessions',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/mock/sessions - List candidate mock sessions
mockRouter.get(
  '/sessions',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/mock/sessions/:id - Get detailed mock session
mockRouter.get(
  '/sessions/:id',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/mock/sessions/:id/aptitude/chunk - Fetch progressive AI questions chunk for practice session
mockRouter.get(
  '/sessions/:id/aptitude/chunk',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
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

      const roleName = session.target_role || req.query.role as string;
      const companyName = session.target_company || req.query.company as string;
      const diffLevel = session.difficulty || req.query.difficulty as string;
      const category = req.query.category as string;

      if (!roleName) {
        return res.status(400).json({ success: false, error: 'Target role is required for question generation' });
      }
      if (!diffLevel || !['easy', 'medium', 'hard'].includes(diffLevel)) {
        return res.status(400).json({ success: false, error: 'Valid difficulty (easy, medium, hard) is required' });
      }
      if (!category) {
        return res.status(400).json({ success: false, error: 'Category is required for question generation' });
      }

      const chunkIndex = Math.max(0, parseInt(req.query.chunkIndex as string, 10) || 0);
      const chunkSize = Math.max(1, Math.min(10, parseInt(req.query.chunkSize as string, 10) || 3));

      const rawChunk = await generateAptitudeChunk({
        jobTitle: roleName,
        jobDescription: `Target Company: ${companyName || 'Tech Enterprise'}. Difficulty: ${diffLevel}`,
        difficulty: diffLevel,
        category,
        chunkIndex,
        chunkSize,
      });

      const sanitizedQuestions = rawChunk.map((q: any) => ({
        id: q.id,
        category: q.category,
        question: q.question || q.text,
        text: q.question || q.text,
        options: q.options,
        difficulty: q.difficulty,
        correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : undefined,
      }));

      return res.json({
        success: true,
        data: {
          chunkIndex,
          chunkSize,
          questions: sanitizedQuestions,
          hasMore: true,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/mock/sessions/:id/aptitude - Fetch dynamic LLM questions for practice mock session
mockRouter.get(
  '/sessions/:id/aptitude',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
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

      const roleName = session.target_role || req.query.role as string;
      const companyName = session.target_company || req.query.company as string;
      const diffLevel = session.difficulty || req.query.difficulty as string;
      const category = req.query.category as string;

      if (!roleName) {
        return res.status(400).json({ success: false, error: 'Target role is required for question generation' });
      }
      if (!diffLevel || !['easy', 'medium', 'hard'].includes(diffLevel)) {
        return res.status(400).json({ success: false, error: 'Valid difficulty (easy, medium, hard) is required' });
      }
      if (!category) {
        return res.status(400).json({ success: false, error: 'Category is required for question generation' });
      }

      const requestedCount = parseInt(req.query.count as string, 10) || 5;
      const batchNum = parseInt(req.query.batch as string, 10) || 1;

      // Generate aptitude questions using AI
      const rawQuestions = await generateAiAptitudeQuestions(
        roleName,
        `Target Company: ${companyName || 'Tech Enterprise'}. Difficulty: ${diffLevel}. Batch: ${batchNum}`,
        requestedCount,
        diffLevel,
        category
      );

      // Practice/mock sessions include correctIndex (no anti-cheat needed for practice)
      const sanitizedQuestions = rawQuestions.map((q: any) => ({
        id: q.id,
        category: q.category,
        question: q.question || q.text,
        text: q.question || q.text,
        options: q.options,
        difficulty: q.difficulty,
        correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : undefined,
      }));

      return res.json({
        success: true,
        data: {
          questions: sanitizedQuestions,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/mock/sessions/:id/coding - Fetch coding problem for mock session
mockRouter.get(
  '/sessions/:id/coding',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = await getCandidateProfileId(req.user!.userId);
      const session = await prisma.mockSession.findFirst({
        where: {
          id: req.params.id as string,
          candidate_id: candidateId,
        },
      });

      const roleName = session?.target_role || (req.query.role as string) || 'Software Engineer';
      const problem = await generateAiCodingProblem(roleName, 'Mock practice coding assessment session', 'medium');

      const sanitizedProblem = {
        ...problem,
        testCases: (problem.testCases || []).filter((tc: any) => !tc.hidden),
      };

      return res.json({
        success: true,
        data: { problem: sanitizedProblem },
      });
    } catch (err) {
      return next(err);
    }
  }
);


// POST /api/v1/mock/sessions/:id/end - End mock session & queue real evaluation
mockRouter.post(
  '/sessions/:id/end',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
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

      const transcript = req.body.transcript;
      if (!Array.isArray(transcript) || transcript.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Transcript is required to complete a mock session.'
        });
      }

      const score = typeof req.body.score === 'number' ? req.body.score : null;

      const updated = await prisma.mockSession.update({
        where: { id: session.id },
        data: {
          status: 'completed',
          score,
          ended_at: new Date(),
          transcript: transcript as any,
        },
      });

      // Queue the real evaluation job
      try {
        await enqueueMockEvaluation(
          updated.id,
          candidateId,
          updated.transcript,
          updated.topic || undefined,
          updated.difficulty || undefined
        );
      } catch (e) {
        console.error('Failed to enqueue mock evaluation job:', e);
        return res.status(500).json({
          success: false,
          error: 'Session saved but evaluation failed to queue. Feedback will not be available.'
        });
      }

      return res.json({
        success: true,
        data: {
          sessionId: updated.id,
          status: 'pending_evaluation',
          message: 'Session completed and queued for evaluation.'
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/mock/sessions/:id/feedback - Get mock session feedback report
mockRouter.get(
  '/sessions/:id/feedback',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
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

      // Only return feedback if evaluation has actually completed
      if (!session.feedback || typeof session.feedback !== 'object' || Object.keys(session.feedback).length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evaluation not yet complete. Feedback will be available once the evaluation worker processes this session.'
        });
      }

      return res.json({
        success: true,
        data: session.feedback,
      });
    } catch (err) {
      return next(err);
    }
  }
);
