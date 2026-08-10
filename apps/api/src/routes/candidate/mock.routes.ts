import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { MockSessionCreateSchema } from '@nextround/shared';
import { enqueueMockEvaluation } from '../../lib/queues/mock.queue';
import { serializeMockSession, serializeMockSessionList } from '../../lib/serializers';
import { selectAptitudeQuestions, selectCodingProblem, toPublicAptitudeQuestions, buildAptitudeDistribution } from '../../services/question-bank.service';
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

/** Normalize junior/mid/senior → easy/medium/hard for AI generators */
function normalizeDifficulty(raw: string | undefined | null): string {
  const map: Record<string, string> = {
    junior: 'easy',
    mid: 'medium',
    senior: 'hard',
    lead: 'hard',
    easy: 'easy',
    medium: 'medium',
    hard: 'hard',
  };
  return map[(raw || '').toLowerCase()] || 'medium';
}

// GET /api/v1/mock/sessions/:id/aptitude/chunk - Serve a chunk of questions from the stored assessment
mockRouter.get(
  '/sessions/:id/aptitude/chunk',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = await getCandidateProfileId(req.user!.userId);
      const session = await prisma.mockSession.findFirst({
        where: { id: req.params.id as string, candidate_id: candidateId },
      });
      if (!session) {
        return res.status(404).json({ success: false, error: 'Mock session not found' });
      }

      const chunkIndex = Math.max(0, parseInt(req.query.chunkIndex as string, 10) || 0);
      const chunkSize  = Math.max(1, Math.min(10, parseInt(req.query.chunkSize as string, 10) || 4));

      // Load (or create) the stored assessment for this mock session
      let assessment = await prisma.assessment.findFirst({
        where: { session_id: session.id, test_type: 'aptitude' },
      });

      let allQuestions: any[] = Array.isArray(assessment?.questions)
        ? (assessment!.questions as any[])
        : [];

       if (allQuestions.length === 0) {
        // First access — select all questions from DB and persist
        const rawDiff   = normalizeDifficulty(session.difficulty);
        
        // Find matching job with assessmentConfig
        const job = await prisma.job.findFirst({
          where: {
            title: { equals: session.target_role, mode: 'insensitive' },
            organization: {
              name: { equals: session.target_company, mode: 'insensitive' },
            },
            status: 'active',
          },
        });

        const assessmentConfig = (job?.assessmentConfig as any) || {};
        const mcqDistribution = assessmentConfig.mcqDistribution as Record<string, number> | undefined;
        const totalCount = mcqDistribution
          ? Object.values(mcqDistribution).reduce((s: number, v: unknown) => s + Number(v), 0)
          : 16;

        const distribution = buildAptitudeDistribution(totalCount, mcqDistribution);
        const selected = await selectAptitudeQuestions({
          distribution,
          difficulty: rawDiff as 'easy' | 'medium' | 'hard',
        });
        allQuestions = selected;

        if (assessment) {
          await prisma.assessment.update({
            where: { id: assessment.id },
            data: { questions: allQuestions as any, total_question_count: allQuestions.length },
          });
        } else {
          assessment = await prisma.assessment.create({
            data: {
              session_id: session.id,
              test_type: 'aptitude',
              questions: allQuestions as any,
              total_question_count: allQuestions.length,
              status: 'in_progress',
            },
          });
        }
      }

      const start = chunkIndex * chunkSize;
      const end   = start + chunkSize;
      // Practice sessions expose correctIndex so candidates get immediate feedback
      const chunk = allQuestions.slice(start, end).map((q: any) => ({
        id: q.id,
        category: q.category,
        question: q.question || q.text,
        text: q.question || q.text,
        options: q.options,
        difficulty: q.difficulty,
        correctIndex: typeof q.correct_index === 'number' ? q.correct_index : undefined,
      }));

      return res.json({
        success: true,
        data: { chunkIndex, chunkSize, questions: chunk, hasMore: allQuestions.length > end },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/mock/sessions/:id/aptitude - Fetch all aptitude questions for a practice session
mockRouter.get(
  '/sessions/:id/aptitude',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = await getCandidateProfileId(req.user!.userId);
      const session = await prisma.mockSession.findFirst({
        where: { id: req.params.id as string, candidate_id: candidateId },
      });
      if (!session) {
        return res.status(404).json({ success: false, error: 'Mock session not found' });
      }

      // Load or create stored assessment
      let assessment = await prisma.assessment.findFirst({
        where: { session_id: session.id, test_type: 'aptitude' },
      });

      let allQuestions: any[] = Array.isArray(assessment?.questions)
        ? (assessment!.questions as any[])
        : [];

      if (allQuestions.length === 0) {
        const rawDiff  = normalizeDifficulty(session.difficulty);
        
        // Find matching job with assessmentConfig
        const job = await prisma.job.findFirst({
          where: {
            title: { equals: session.target_role, mode: 'insensitive' },
            organization: {
              name: { equals: session.target_company, mode: 'insensitive' },
            },
            status: 'active',
          },
        });

        const assessmentConfig = (job?.assessmentConfig as any) || {};
        const mcqDistribution = assessmentConfig.mcqDistribution as Record<string, number> | undefined;
        const totalCount = mcqDistribution
          ? Object.values(mcqDistribution).reduce((s: number, v: unknown) => s + Number(v), 0)
          : 16;

        const distribution = buildAptitudeDistribution(totalCount, mcqDistribution);
        const selected = await selectAptitudeQuestions({
          distribution,
          difficulty: rawDiff as 'easy' | 'medium' | 'hard',
        });
        allQuestions = selected;

        if (assessment) {
          await prisma.assessment.update({
            where: { id: assessment.id },
            data: { questions: allQuestions as any, total_question_count: allQuestions.length },
          });
        } else {
          await prisma.assessment.create({
            data: {
              session_id: session.id,
              test_type: 'aptitude',
              questions: allQuestions as any,
              total_question_count: allQuestions.length,
              status: 'in_progress',
            },
          });
        }
      }

      // Practice mode: include correctIndex for immediate feedback
      const questions = allQuestions.map((q: any) => ({
        id: q.id,
        category: q.category,
        question: q.question || q.text,
        text: q.question || q.text,
        options: q.options,
        difficulty: q.difficulty,
        correctIndex: typeof q.correct_index === 'number' ? q.correct_index : undefined,
      }));

      return res.json({ success: true, data: { questions } });
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
        where: { id: req.params.id as string, candidate_id: candidateId },
      });

      const rawDiff = normalizeDifficulty(session?.difficulty);

      // Check for existing snapshot to guarantee session immutability
      const existing = await prisma.assessment.findFirst({
        where: { session_id: session?.id, test_type: 'coding' },
      });

      let problem: any;
      if (existing?.questions) {
        problem = existing.questions;
      } else {
        const selected = await selectCodingProblem({
          difficulty: rawDiff as 'easy' | 'medium' | 'hard',
        });
        problem = selected;

        if (session) {
          await prisma.assessment.create({
            data: {
              session_id: session.id,
              test_type: 'coding',
              questions: problem as any,
              status: 'in_progress',
            },
          });
        }
      }

      const sanitizedProblem = {
        ...problem,
        testCases: (problem.testCases || []).filter((tc: any) => !tc.hidden),
      };

      return res.json({ success: true, data: { problem: sanitizedProblem } });
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
      // Transcript is optional for aptitude/coding tracks — they don't generate
      // a voice transcript. Fall back to an empty array so the session still
      // completes and feedback is derivable from the score alone.
      const safeTranscript = Array.isArray(transcript) && transcript.length > 0 ? transcript : [];

      const score = typeof req.body.score === 'number' ? req.body.score : null;

      const updated = await prisma.mockSession.update({
        where: { id: session.id },
        data: {
          status: 'completed',
          score,
          ended_at: new Date(),
          transcript: safeTranscript as any,
        },
      });

      // For aptitude/coding tracks with no voice transcript, write basic
      // score-derived feedback immediately so the feedback page is never stuck.
      if (safeTranscript.length === 0 && score !== null) {
        const pct = Math.max(0, Math.min(100, score));
        const basicFeedback = {
          overallScore: pct,
          rubricScores: { clarity: pct, depth: pct, examples: pct, technicalAccuracy: pct },
          strengths: pct >= 70
            ? ['Completed the assessment', 'Demonstrated subject knowledge']
            : ['Attempted all sections'],
          growthAreas: pct < 70
            ? ['Review weak categories and practice more questions']
            : ['Continue practising to maintain consistency'],
          starAnalysis: { situation: '', task: '', action: '', result: '' },
          recommendedPrep: ['Review incorrect answers', 'Practice timed question sets'],
        };
        await prisma.mockSession.update({
          where: { id: session.id },
          data: { feedback: basicFeedback as any },
        });
      }

      // Only enqueue AI evaluation for voice interviews that have a real transcript.
      // Aptitude/coding tracks write feedback synchronously above.
      if (safeTranscript.length > 0) {
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
          // Non-fatal for voice sessions — basic feedback is still derivable
        }
      }

      return res.json({
        success: true,
        data: {
          sessionId: updated.id,
          status: safeTranscript.length > 0 ? 'pending_evaluation' : 'completed',
          message: safeTranscript.length > 0
            ? 'Session completed and queued for AI evaluation.'
            : 'Session completed. Feedback is ready.',
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
