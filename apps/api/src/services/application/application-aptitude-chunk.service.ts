import { prisma, Prisma } from '@nextround/database';
import {
  selectAptitudeQuestions,
  buildAptitudeDistribution,
} from '../questions/question-bank.service';
import { forbidden } from '../../lib/http-errors';

function getAppForCandidate(appId: string, userId: string) {
  return prisma.application.findUnique({
    where: { id: appId },
    include: { candidate: true, job: true },
  });
}

interface StoredQuestion {
  id: string;
  category?: string;
  question?: string;
  text?: string;
  options?: string[];
  difficulty?: string;
  correct_index?: number;
  correctIndex?: number;
}

export async function getAptitudeChunk(
  appId: string,
  userId: string,
  opts: { chunkIndex: number; chunkSize: number }
) {
  const application = await getAppForCandidate(appId, userId);
  if (!application || application.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  const { chunkIndex, chunkSize } = opts;

  let assessment = await prisma.assessment.findFirst({
    where: { application_id: appId, test_type: 'aptitude' },
    orderBy: { created_at: 'desc' },
  });

  const existingQuestions = Array.isArray(assessment?.questions)
    ? (assessment!.questions as unknown as StoredQuestion[])
    : [];
  const startIndex = chunkIndex * chunkSize;
  const endIndex = startIndex + chunkSize;

  if (existingQuestions.length >= endIndex) {
    const chunkQuestions = existingQuestions.slice(startIndex, endIndex).map((questionItem) => ({
      id: questionItem.id,
      category: questionItem.category,
      question: questionItem.question || questionItem.text,
      text: questionItem.question || questionItem.text,
      options: questionItem.options || [],
      difficulty: questionItem.difficulty || 'medium',
    }));
    return {
      assessmentId: assessment?.id,
      chunkIndex,
      chunkSize,
      questions: chunkQuestions,
      hasMore: existingQuestions.length > endIndex,
    };
  }

  const assessmentConfig = (application.job?.assessmentConfig as Record<string, unknown>) || {};
  const mcqDistribution = assessmentConfig.mcqDistribution as Record<string, number> | undefined;
  const totalCount = mcqDistribution
    ? Object.values(mcqDistribution).reduce((sum, val) => sum + Number(val), 0)
    : Math.max(1, Math.min(100, Number(assessmentConfig.mcqCount) || 20));

  const distribution = buildAptitudeDistribution(totalCount, mcqDistribution);
  const allQuestions = await selectAptitudeQuestions({ distribution });

  if (assessment) {
    assessment = await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        questions: allQuestions as unknown as Prisma.InputJsonValue,
        total_question_count: allQuestions.length,
        status: 'in_progress',
      },
    });
  } else {
    assessment = await prisma.assessment.create({
      data: {
        application_id: appId,
        test_type: 'aptitude',
        questions: allQuestions as unknown as Prisma.InputJsonValue,
        total_question_count: allQuestions.length,
        status: 'in_progress',
      },
    });
  }

  const chunkQuestions = allQuestions.slice(startIndex, endIndex).map((questionItem) => ({
    id: questionItem.id,
    category: questionItem.category,
    question: questionItem.question,
    text: questionItem.text,
    options: questionItem.options,
    difficulty: questionItem.difficulty,
  }));

  return {
    assessmentId: assessment.id,
    chunkIndex,
    chunkSize,
    questions: chunkQuestions,
    hasMore: allQuestions.length > endIndex,
  };
}

export async function submitAptitudeChunk(
  appId: string,
  userId: string,
  body: { chunkIndex?: number; chunkSize?: number; answers?: unknown[] }
) {
  const application = await getAppForCandidate(appId, userId);
  if (!application || application.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  const { chunkIndex = 0, chunkSize = 3, answers = [] } = body;

  const assessment = await prisma.assessment.findFirst({
    where: { application_id: appId, test_type: 'aptitude' },
    orderBy: { created_at: 'desc' },
  });

  if (assessment) {
    const existingResponses = Array.isArray(assessment.responses) ? (assessment.responses as unknown[]) : [];
    const mergedResponses = [...existingResponses, ...(Array.isArray(answers) ? answers : [])];
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { responses: mergedResponses as unknown as Prisma.InputJsonValue, status: 'in_progress' },
    });
  }

  const nextChunkIndex = Number(chunkIndex) + 1;
  const existingQuestions = Array.isArray(assessment?.questions)
    ? (assessment!.questions as unknown as StoredQuestion[])
    : [];

  const startOfNext = nextChunkIndex * Number(chunkSize);
  const endOfNext = startOfNext + Number(chunkSize);
  const nextQuestions = existingQuestions.slice(startOfNext, endOfNext).map((questionItem) => ({
    id: questionItem.id,
    category: questionItem.category,
    question: questionItem.question || questionItem.text,
    text: questionItem.question || questionItem.text,
    options: questionItem.options || [],
    difficulty: questionItem.difficulty || 'medium',
  }));

  return {
    currentChunkSubmitted: chunkIndex,
    nextChunkIndex,
    questions: nextQuestions,
    hasMore: true,
  };
}
