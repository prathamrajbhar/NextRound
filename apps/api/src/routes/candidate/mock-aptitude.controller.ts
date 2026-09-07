import { Request, Response, NextFunction } from 'express';
import { prisma, Prisma } from '@nextround/database';
import {
  selectAptitudeQuestions,
  buildAptitudeDistribution,
} from '../../services/question-bank.service';
import { getCandidateProfileId } from '../../lib/candidate-profile';

export function normalizeDifficulty(raw: string | undefined | null): 'easy' | 'medium' | 'hard' {
  const map: Record<string, 'easy' | 'medium' | 'hard'> = {
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

interface StoredMockQuestion {
  id: string;
  category?: string;
  question?: string;
  text?: string;
  options?: string[];
  difficulty?: string;
  correct_index?: number;
}

function formatMockQuestion(q: StoredMockQuestion) {
  return {
    id: q.id,
    category: q.category,
    question: q.question || q.text,
    text: q.question || q.text,
    options: q.options,
    difficulty: q.difficulty,
    correctIndex: typeof q.correct_index === 'number' ? q.correct_index : undefined,
  };
}

export async function getMockAptitudeChunk(req: Request, res: Response, next: NextFunction) {
  try {
    const candidateId = await getCandidateProfileId(req.user!.userId);
    const session = await prisma.mockSession.findFirst({
      where: { id: req.params.id as string, candidate_id: candidateId },
    });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Mock session not found' });
    }

    const chunkIndex = Math.max(0, parseInt(req.query.chunkIndex as string, 10) || 0);
    const chunkSize = Math.max(1, Math.min(10, parseInt(req.query.chunkSize as string, 10) || 4));

    let assessment = await prisma.assessment.findFirst({
      where: { session_id: session.id, test_type: 'aptitude' },
    });

    let allQuestions: StoredMockQuestion[] = Array.isArray(assessment?.questions)
      ? (assessment!.questions as unknown as StoredMockQuestion[])
      : [];

    const job = await prisma.job.findFirst({
      where: {
        title: { equals: session.target_role, mode: 'insensitive' },
        organization: { name: { equals: session.target_company, mode: 'insensitive' } },
        status: 'active',
      },
    });

    const assessmentConfig = (job?.assessmentConfig as Record<string, unknown>) || {};
    const mcqDistribution = assessmentConfig.mcqDistribution as Record<string, number> | undefined;
    const totalCount = mcqDistribution
      ? Object.values(mcqDistribution).reduce((s: number, v: unknown) => s + Number(v), 0)
      : 16;

    if (allQuestions.length !== totalCount) {
      const rawDiff = normalizeDifficulty(session.difficulty);
      const distribution = buildAptitudeDistribution(totalCount, mcqDistribution);
      const selected = await selectAptitudeQuestions({ distribution, difficulty: rawDiff });
      allQuestions = selected as unknown as StoredMockQuestion[];

      if (assessment) {
        await prisma.assessment.update({
          where: { id: assessment.id },
          data: { questions: allQuestions as unknown as Prisma.InputJsonValue, total_question_count: allQuestions.length },
        });
      } else {
        assessment = await prisma.assessment.create({
          data: {
            session_id: session.id,
            test_type: 'aptitude',
            questions: allQuestions as unknown as Prisma.InputJsonValue,
            total_question_count: allQuestions.length,
            status: 'in_progress',
          },
        });
      }
    }

    const start = chunkIndex * chunkSize;
    const end = start + chunkSize;
    const chunk = allQuestions.slice(start, end).map(formatMockQuestion);

    return res.json({
      success: true,
      data: { chunkIndex, chunkSize, questions: chunk, hasMore: allQuestions.length > end },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMockAptitude(req: Request, res: Response, next: NextFunction) {
  try {
    const candidateId = await getCandidateProfileId(req.user!.userId);
    const session = await prisma.mockSession.findFirst({
      where: { id: req.params.id as string, candidate_id: candidateId },
    });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Mock session not found' });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { session_id: session.id, test_type: 'aptitude' },
    });

    const job = await prisma.job.findFirst({
      where: {
        title: { equals: session.target_role, mode: 'insensitive' },
        organization: { name: { equals: session.target_company, mode: 'insensitive' } },
        status: 'active',
      },
    });

    const assessmentConfig = (job?.assessmentConfig as Record<string, unknown>) || {};
    const mcqDistribution = assessmentConfig.mcqDistribution as Record<string, number> | undefined;
    const totalCount = mcqDistribution
      ? Object.values(mcqDistribution).reduce((s: number, v: unknown) => s + Number(v), 0)
      : 16;

    const isCompleted = assessment?.status === 'completed';
    let allQuestions: StoredMockQuestion[] = [];

    if (isCompleted && Array.isArray(assessment?.questions) && (assessment!.questions as unknown[]).length > 0) {
      allQuestions = assessment!.questions as unknown as StoredMockQuestion[];
    } else {
      const rawDiff = normalizeDifficulty(session.difficulty);
      const distribution = buildAptitudeDistribution(totalCount, mcqDistribution);
      const selected = await selectAptitudeQuestions({ distribution, difficulty: rawDiff });
      allQuestions = selected as unknown as StoredMockQuestion[];

      if (assessment) {
        await prisma.assessment.update({
          where: { id: assessment.id },
          data: { questions: allQuestions as unknown as Prisma.InputJsonValue, total_question_count: allQuestions.length },
        });
      } else {
        await prisma.assessment.create({
          data: {
            session_id: session.id,
            test_type: 'aptitude',
            questions: allQuestions as unknown as Prisma.InputJsonValue,
            total_question_count: allQuestions.length,
            status: 'in_progress',
          },
        });
      }
    }

    const questions = allQuestions.map(formatMockQuestion);

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
  } catch (error) {
    return next(error);
  }
}
