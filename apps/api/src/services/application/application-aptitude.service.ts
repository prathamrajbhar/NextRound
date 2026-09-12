import { prisma, Prisma } from '@nextround/database';
import { logger } from '../../lib/logger';
import { enqueueAssessment, type AptitudeAnswer } from '../../lib/queues/assessment.queue';
import {
  selectAptitudeQuestions,
  buildAptitudeDistribution,
} from '../questions/question-bank.service';
import { forbidden } from '../../lib/http-errors';
import { resolveAptitudeQuestions } from './aptitude-questions.resolver';


export * from './application-aptitude-chunk.service';

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

export async function getAptitudeAssessment(appId: string, userId: string) {
  const application = await getAppForCandidate(appId, userId);
  if (!application || application.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  const assessmentConfig = (application.job?.assessmentConfig as Record<string, unknown>) || {};
  const mcqDistribution = assessmentConfig.mcqDistribution as Record<string, number> | undefined;
  const totalCount = mcqDistribution
    ? Object.values(mcqDistribution).reduce((sum: number, val: unknown) => sum + Number(val), 0)
    : Math.max(1, Math.min(100, Number(assessmentConfig.mcqCount) || 20));

  let assessment = await prisma.assessment.findFirst({
    where: { application_id: appId, test_type: 'aptitude' },
    orderBy: { created_at: 'desc' },
  });

  const rawCustomQuestions = Array.isArray(assessmentConfig.customQuestions)
    ? (assessmentConfig.customQuestions as unknown as StoredQuestion[])
    : [];

  let allQuestions: StoredQuestion[] = [];

  const isCompleted = assessment?.status === 'completed';
  const storedQuestions = Array.isArray(assessment?.questions)
    ? (assessment!.questions as unknown as StoredQuestion[])
    : [];

  const storedCount = storedQuestions.length;
  const targetCount = rawCustomQuestions.length > 0 ? rawCustomQuestions.length : totalCount;

  if (storedCount > 0 && (isCompleted || storedCount === targetCount)) {
    allQuestions = storedQuestions;
  } else {
    allQuestions = await resolveAptitudeQuestions({
      assessmentConfig,
      jobTitle: application.job?.title,
      jobDescription: application.job?.description,
    });
  }


    if (assessment) {
      assessment = await prisma.assessment.update({
        where: { id: assessment.id },
        data: {
          questions: allQuestions as unknown as Prisma.InputJsonValue,
          total_question_count: allQuestions.length,
          status: 'pending',
          responses: [],
        },
      });
    } else {
      assessment = await prisma.assessment.create({
        data: {
          application_id: appId,
          test_type: 'aptitude',
          questions: allQuestions as unknown as Prisma.InputJsonValue,
          total_question_count: allQuestions.length,
          status: 'pending',
        },
      });
    }

  const sanitizedQuestions = allQuestions.map((questionItem) => ({
    id: questionItem.id,
    category: questionItem.category,
    question: questionItem.question || questionItem.text,
    text: questionItem.question || questionItem.text,
    options: questionItem.options || [],
    difficulty: questionItem.difficulty || 'medium',
    correctIndex: typeof questionItem.correct_index === 'number' ? questionItem.correct_index : questionItem.correctIndex,
  }));

  return {
    assessmentId: assessment?.id,
    questions: sanitizedQuestions,
    mcqDistribution: mcqDistribution || {
      'Quantitative Aptitude': 5,
      'Logical Reasoning': 5,
      'Verbal Ability': 5,
      'Data Interpretation': 5,
    },
  };
}

export async function submitAptitude(
  appId: string,
  userId: string,
  body: { answers?: AptitudeAnswer[]; totalTimeSeconds?: number; tabSwitchCount?: number }
) {
  const application = await getAppForCandidate(appId, userId);
  if (!application || application.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  const { answers, totalTimeSeconds, tabSwitchCount } = body;

  await prisma.assessment
    .updateMany({
      where: { application_id: appId, test_type: 'aptitude' },
      data: {
        responses: (answers as unknown as Prisma.InputJsonValue) || [],
        status: 'in_progress',
      },
    })
    .catch((err) => {
      logger.child('Applications').error(`Failed to update assessment responses for application ${appId}:`, err);
    });

  const storedAssessment = await prisma.assessment.findFirst({
    where: { application_id: appId, test_type: 'aptitude' },
    orderBy: { created_at: 'desc' },
  });
  const storedQuestions = Array.isArray(storedAssessment?.questions)
    ? (storedAssessment!.questions as Array<{ id?: string; correctIndex?: unknown; correct_index?: unknown }>)
    : [];
  const answersArr = Array.isArray(answers)
    ? (answers as Array<{ questionId?: string; selectedOption?: unknown }>)
    : [];
  const answerMap = new Map(answersArr.map((answerItem) => [answerItem.questionId, answerItem.selectedOption]));
  let correctCount = 0;
  let totalScored = 0;
  for (const questionItem of storedQuestions) {
    const correctIdx = questionItem.correctIndex !== undefined ? questionItem.correctIndex : questionItem.correct_index;
    if (typeof correctIdx !== 'number') continue;

    if (!answerMap.has(questionItem.id)) continue;
    totalScored++;
    if (answerMap.get(questionItem.id) === correctIdx) correctCount++;
  }
  const computedScore = totalScored > 0 ? Math.round((correctCount / totalScored) * 100) : null;

  await enqueueAssessment(appId, answers || [], { totalTimeSeconds, tabSwitchCount });

  return {
    score: computedScore,
    correctAnswers: correctCount,
    totalQuestions: totalScored,
    message: 'Aptitude assessment submitted successfully. Processing score...',
  };
}
