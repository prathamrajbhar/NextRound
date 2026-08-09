import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { MockSessionCreateSchema } from '@nextround/shared';
import { enqueueMockEvaluation } from '../../lib/queues/mock.queue';
import { serializeMockSession, serializeMockSessionList } from '../../lib/serializers';
import { generateAiAptitudeQuestions } from '../../services/ai-question-generator.service';
import { generateAiCodingProblem } from '../../services/ai-coding-generator.service';
// Canonical shared aptitude bank — single source of truth (packages/shared/data).
import aptitudeFallbackQuestions from '@nextround/shared/data/aptitude-questions.json';
import codingProblems from '@nextround/shared/data/coding-problems.json';


export const mockRouter = Router();

// Helper to get or create candidate profile for current user
async function getCandidateProfileId(userId: string): Promise<string> {
  let profile = await prisma.candidateProfile.findUnique({
    where: { user_id: userId },
    select: { id: true },
  });
  if (!profile) {
    profile = await prisma.candidateProfile.create({
      data: { user_id: userId },
      select: { id: true },
    });
  }
  return profile.id;
}

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

      const mockSession = await prisma.mockSession.create({
        data: {
          candidate_id: candidateId,
          target_company: targetCompany || 'General Tech',
          target_role: targetRole || 'Software Engineer',
          topic: topic || 'System Design',
          difficulty: difficulty || 'medium',
          type: 'mock',
          status: 'active',
          focus_areas: focusAreas || [],
          rubric: {
            clarity: 25,
            depth: 25,
            examples: 25,
            technicalAccuracy: 25,
          },
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

      const roleName = session?.target_role || session?.topic || (req.query.role as string) || (req.query.topic as string) || 'Software Engineer';
      const companyName = session?.target_company || (req.query.company as string) || 'Tech Enterprise';
      const diffLevel = session?.difficulty || (req.query.difficulty as string) || 'medium';
      const requestedCount = parseInt(req.query.count as string, 10) || 4;
      const batchNum = parseInt(req.query.batch as string, 10) || 1;

      // Generate aptitude questions using Gemini directly
      const rawQuestions = await generateAiAptitudeQuestions(
        roleName,
        `Target Company: ${companyName}. Difficulty: ${diffLevel}. Batch: ${batchNum}`,
        requestedCount
      );

      // Practice/mock sessions include correctIndex (no anti-cheat needed for practice)
      const sanitizedQuestions = rawQuestions.map((q: any) => ({
        id: q.id,
        category: q.category || 'Logical Reasoning',
        question: q.question || q.text,
        text: q.question || q.text,
        options: q.options || [],
        difficulty: q.difficulty || diffLevel,
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


// Helper to build feedback object from real session transcript (no fabricated scores or telemetry)
function generateDynamicFeedback(session: any, rawTranscript?: any, rawScore?: number) {
  const transcript = Array.isArray(rawTranscript) ? rawTranscript : (Array.isArray(session.transcript) ? session.transcript : []);
  const candidateMsgs = transcript.filter((t: any) => t.role === 'candidate' || t.speaker === 'candidate');
  const interviewerMsgs = transcript.filter((t: any) => t.role === 'interviewer' || t.speaker === 'interviewer');

  const transcriptHighlights = [];
  const minLen = Math.min(interviewerMsgs.length, candidateMsgs.length);
  for (let i = 0; i < minLen; i++) {
    const q = interviewerMsgs[i]?.text || interviewerMsgs[i]?.content || '';
    const a = candidateMsgs[i]?.text || candidateMsgs[i]?.content;
    if (a && a !== 'No response recorded.') {
      transcriptHighlights.push({
        speaker: q,
        timestamp: candidateMsgs[i]?.timestamp || new Date().toISOString(),
        text: a,
        note: '',
      });
    }
  }

  const score = rawScore !== undefined ? rawScore : (session.score ?? 0);

  return {
    sessionId: session.id,
    targetCompany: session.target_company || '',
    targetRole: session.target_role || '',
    difficulty: session.difficulty || '',
    overallScore: score,
    detailedBreakdown: [
      {
        category: 'Overall Evaluation',
        score,
        feedback: candidateMsgs.length > 0
          ? `Evaluated candidate session with ${candidateMsgs.length} response(s) recorded.`
          : `Session completed without recorded candidate responses.`,
      },
    ],
    keyStrengths: [],
    areasToImprove: [],
    metrics: {},
    telemetry: {
      gazeFocusPercent: null,
      speechWpm: null,
      verified: false,
    },
    transcriptHighlights,
  };
}

// POST /api/v1/mock/sessions/:id/end - End mock session & compute evaluation
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

      const transcript = req.body.transcript || session.transcript || [];
      const score = req.body.score !== undefined ? req.body.score : (session.score ?? 0);
      const feedbackObj = generateDynamicFeedback(session, transcript, score);

      const updated = await prisma.mockSession.update({
        where: { id: session.id },
        data: {
          status: 'completed',
          score,
          ended_at: new Date(),
          transcript: transcript as any,
          feedback: feedbackObj as any,
        },
      });

      try {
        await enqueueMockEvaluation(
          updated.id,
          candidateId,
          updated.transcript,
          updated.topic || undefined,
          updated.difficulty || undefined
        );
      } catch (e) {
        console.warn('Queue worker bypassed; evaluation will not be ready until a real worker processes it.', e);
      }

      return res.json({
        success: true,
        data: feedbackObj,
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

      const feedbackData = (session.feedback && typeof session.feedback === 'object' && Object.keys(session.feedback).length > 0)
        ? session.feedback
        : generateDynamicFeedback(session);

      return res.json({
        success: true,
        data: feedbackData,
      });
    } catch (err) {
      return next(err);
    }
  }
);
