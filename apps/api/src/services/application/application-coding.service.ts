import { prisma, Prisma } from '@nextround/database';
import { selectCodingProblem } from '../questions/question-bank.service';
import { executeCodingSubmission } from '../coding/coding-executor.service';
import { notFound, forbidden } from '../../lib/http-errors';

function getAppForCandidate(appId: string, userId: string) {
  return prisma.application.findUnique({
    where: { id: appId },
    include: { candidate: true, job: true },
  });
}

interface CodingTestCase {
  name?: string;
  args?: unknown[];
  expected?: unknown;
  hidden?: boolean;
}

interface CodingProblemStructure {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  difficulty?: string;
  entryPoint?: string;
  paramSchema?: Array<{ name: string; type: string }>;
  returnType?: string;
  testCases?: CodingTestCase[];
  publicTests?: CodingTestCase[];
  hiddenTests?: CodingTestCase[];
}

export async function getCodingAssessment(appId: string, userId: string) {
  const application = await getAppForCandidate(appId, userId);
  if (!application || application.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  let assessment = await prisma.assessment.findFirst({
    where: { application_id: appId, test_type: 'coding' },
  });

  let problem: CodingProblemStructure;

  if (assessment && assessment.questions) {
    problem = assessment.questions as unknown as CodingProblemStructure;
  } else {
    const jobConfig = (application.job?.thresholds as Record<string, unknown>) || {};
    const difficulty = jobConfig.difficulty as 'easy' | 'medium' | 'hard' | undefined;

    const selected = await selectCodingProblem({ difficulty });
    problem = selected as unknown as CodingProblemStructure;

    assessment = await prisma.assessment.create({
      data: {
        application_id: appId,
        test_type: 'coding',
        questions: problem as unknown as Prisma.InputJsonValue,
        status: 'in_progress',
      },
    });
  }

  const sanitizedProblem = {
    ...problem,
    testCases: (problem.testCases || []).filter((testCase) => !testCase.hidden),
  };

  return { problem: sanitizedProblem };
}

export async function submitCoding(
  appId: string,
  userId: string,
  body: { code?: string; language?: string }
) {
  const application = await getAppForCandidate(appId, userId);
  if (!application || application.candidate.user_id !== userId) {
    throw forbidden('Forbidden: Access denied');
  }

  const { code, language } = body;

  const assessment = await prisma.assessment.findFirst({
    where: { application_id: appId, test_type: 'coding' },
  });

  if (!assessment) {
    throw notFound('Coding assessment not found. Please retrieve the problem first.');
  }

  const currentProblem = assessment.questions as unknown as CodingProblemStructure;
  const rawTestCases = currentProblem.testCases || [];
  const testCasesToRun = rawTestCases.map((tc, index) => ({
    name: tc.name || `Test Case ${index + 1}`,
    args: tc.args || [],
    expected: tc.expected,
    hidden: tc.hidden,
  }));

  const execSummary = executeCodingSubmission(code || '', language || 'python', testCasesToRun);

  const submission = await prisma.codingSubmission.create({
    data: {
      application_id: appId,
      problem_id: currentProblem.id || null,
      code: code || '',
      language: language || 'python',
      status: execSummary.allPassed ? 'passed' : 'failed',
      test_results: JSON.parse(
        JSON.stringify({
          status: execSummary.allPassed ? 'passed' : 'failed',
          passRate: execSummary.passRate,
          results: execSummary.results,
          logs: execSummary.logs,
          ai_feedback: execSummary.allPassed
            ? 'All test cases passed cleanly!'
            : `${execSummary.passRate}% pass rate achieved.`,
        })
      ),
      pass_rate: execSummary.passRate,
      pass_rate_percent: execSummary.passRate,
      pass_rate_ratio: execSummary.passRateRatio,
    },
  });

  await prisma.assessment.update({
    where: { id: assessment.id },
    data: {
      status: 'completed',
      score: execSummary.passRate,
    },
  });

  await prisma.evaluation.upsert({
    where: { application_id: appId },
    create: {
      application_id: appId,
      stage: 'assessment',
      coding_score: execSummary.passRate,
      reasoning: `Candidate achieved ${execSummary.passRate}% pass rate on coding assessment. Pending recruiter evaluation.`,
    },
    update: {
      coding_score: execSummary.passRate,
      reasoning: `Candidate achieved ${execSummary.passRate}% pass rate on coding assessment. Pending recruiter evaluation.`,
    },
  });

  return {
    submissionId: submission.id,
    status: submission.status,
    passRate: execSummary.passRate,
    results: execSummary.results,
  };
}

export async function getCodingSubmission(submissionId: string) {
  const submission = await prisma.codingSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw notFound('Submission not found');
  }

  return { submission };
}
