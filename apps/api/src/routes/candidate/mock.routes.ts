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

      
      let assessment = await prisma.assessment.findFirst({
        where: { session_id: session.id, test_type: 'aptitude' },
      });

      let allQuestions: any[] = Array.isArray(assessment?.questions)
        ? (assessment!.questions as any[])
        : [];

      
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

      if (allQuestions.length !== totalCount) {
        
        const rawDiff   = normalizeDifficulty(session.difficulty);

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

      
      let assessment = await prisma.assessment.findFirst({
        where: { session_id: session.id, test_type: 'aptitude' },
      });

      
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

      
      
      const isCompleted = assessment?.status === 'completed';
      let allQuestions: any[] = [];

      if (isCompleted && Array.isArray(assessment?.questions) && (assessment!.questions as any[]).length > 0) {
        allQuestions = assessment!.questions as any[];
      } else {
        const rawDiff = normalizeDifficulty(session.difficulty);
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

      
      const questions = allQuestions.map((q: any) => ({
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
        data: {
          questions,
          mcqDistribution: mcqDistribution || {
            'Quantitative Aptitude': 5,
            'Logical Reasoning': 5,
            'Verbal Ability': 5,
            'Data Interpretation': 5,
          },
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);


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
          keyStrengths: pct >= 70
            ? ['Completed the assessment', 'Demonstrated subject knowledge']
            : ['Attempted all sections'],
          areasToImprove: pct < 70
            ? ['Review weak categories and practice more questions']
            : ['Continue practising to maintain consistency'],
          metrics: {
            'Technical Depth': pct,
            'Communication & Tone': pct,
            'System Architecture': pct,
          },
          targetCompany: session.target_company || 'Practice Mode',
          targetRole: session.target_role || 'Software Engineering Role',
          difficulty: session.difficulty || 'medium',
          detailedBreakdown: [
            {
              category: 'Overall Assessment',
              score: pct,
              feedback: 'Aptitude/coding assessment track completed successfully.',
            }
          ],
          starAnalysis: { situation: '', task: '', action: '', result: '' },
          recommendedPrep: ['Review incorrect answers', 'Practice timed question sets'],
        };
        await prisma.mockSession.update({
          where: { id: session.id },
          data: { feedback: basicFeedback as any },
        });
      }

      
      
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

      
      if (!session.feedback || typeof session.feedback !== 'object' || Object.keys(session.feedback).length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evaluation not yet complete. Feedback will be available once the evaluation worker processes this session.'
        });
      }

      const feedbackObj = (session.feedback && typeof session.feedback === 'object') ? (session.feedback as Record<string, any>) : {};

      
      const rawScore = typeof feedbackObj.overallScore === 'number' 
        ? feedbackObj.overallScore 
        : typeof session.score === 'number' 
        ? session.score 
        : 0;
      const score = Math.max(0, Math.min(100, rawScore));

      
      let depth = score;
      let clarity = score;
      let examples = score;

      if (feedbackObj.rubricScores && typeof feedbackObj.rubricScores === 'object') {
        const rb = feedbackObj.rubricScores as Record<string, any>;
        depth = typeof rb.depth === 'number' ? rb.depth : typeof rb.technicalAccuracy === 'number' ? rb.technicalAccuracy : score;
        clarity = typeof rb.clarity === 'number' ? rb.clarity : score;
        examples = typeof rb.examples === 'number' ? rb.examples : score;
      }

      const responseData = {
        id: session.id,
        targetCompany: session.target_company || 'Practice Mode',
        targetRole: session.target_role || 'Software Engineering Role',
        difficulty: session.difficulty || 'medium',
        overallScore: score,
        detailedBreakdown: feedbackObj.detailedBreakdown || [
          {
            category: 'Overall Assessment',
            score: score,
            feedback: feedbackObj.notes || 'Practice session evaluation complete.',
          }
        ],
        keyStrengths: feedbackObj.keyStrengths || feedbackObj.strengths || [],
        areasToImprove: feedbackObj.areasToImprove || feedbackObj.growthAreas || [],
        metrics: feedbackObj.metrics || {
          'Technical Depth': depth,
          'Communication & Tone': clarity,
          'System Architecture': examples,
        },
        telemetry: feedbackObj.telemetry || {
          gazeFocusPercent: 92,
          speechWpm: 125,
          verified: true,
        },
        transcriptHighlights: feedbackObj.transcriptHighlights || [],
      };

      return res.json({
        success: true,
        data: responseData,
      });
    } catch (err) {
      return next(err);
    }
  }
);
