import { Router, Request, Response, NextFunction } from 'express';
import { selectCodingProblem } from '../../services/question-bank.service';
import { enqueueSubmissionExecution } from '../../services/submission-queue.service';
import { authenticate } from '../../middleware/auth';
import { CodingExecutionRequestSchema } from '@nextround/shared';
import { prisma } from '@nextround/database';
import { executeCodingSubmission } from '../../services/coding-executor.service';
import { updateApplicationCodingScore } from '../../services/scoring.service';
import crypto from 'crypto';

export const codingRouter = Router();

codingRouter.get('/problem', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const difficulty = (req.query.difficulty as 'easy' | 'medium' | 'hard') || undefined;
    const category   = (req.query.category as string) || undefined;

    const problem = await selectCodingProblem({ difficulty, category });

    const sanitized = {
      ...problem,
      testCases: problem.testCases.filter(tc => !tc.hidden),
    };

    return res.json({ success: true, data: { problem: sanitized } });
  } catch (err) {
    return next(err);
  }
});

codingRouter.post('/execute', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CodingExecutionRequestSchema.parse(req.body);

    const submission = await enqueueSubmissionExecution({
      applicationId: validated.assessmentId,
      problemId: validated.problemId,
      code: validated.code,
      language: validated.language,
      idempotencyKey: validated.idempotencyKey,
    });

    return res.status(202).json({
      success: true,
      data: {
        submissionId: submission.id,
        status: submission.status,
        attemptNumber: submission.attempt_number,
        idempotencyKey: submission.idempotency_key,
        message: 'Submission queued successfully for execution.',
      },
    });
  } catch (err) {
    return next(err);
  }
});

codingRouter.post('/run', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, language, problemId } = req.body;
    if (!code || !language || !problemId) {
      return res.status(400).json({ success: false, error: 'code, language, and problemId are required' });
    }

    const problem = await prisma.codingProblem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return res.status(404).json({ success: false, error: 'Coding problem not found' });
    }

    const publicTests = (problem.public_tests as any[]) || [];

    const summary = executeCodingSubmission(code, language, publicTests, problem.entry_point || 'solution');

    const testResults = summary.results.map((res) => ({
      name: res.name,
      input: JSON.stringify(res.args),
      expected: JSON.stringify(res.expected),
      actual: res.errorMessage || JSON.stringify(res.actual),
      status: res.status === 'passed' ? ('passed' as const) : ('failed' as const),
      time: `${(res.timeMs / 1000).toFixed(3)}s`,
    }));

    return res.json({
      success: true,
      stdout_stderr: summary.logs.join('\n'),
      test_results: testResults,
    });
  } catch (err) {
    return next(err);
  }
});

codingRouter.post('/submit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, language, problemId, applicationId } = req.body;
    if (!code || !language || !problemId) {
      return res.status(400).json({ success: false, error: 'code, language, and problemId are required' });
    }

    const problem = await prisma.codingProblem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return res.status(404).json({ success: false, error: 'Coding problem not found' });
    }

    const publicTests = (problem.public_tests as any[]) || [];
    const hiddenTests = (problem.hidden_tests as any[]) || [];
    const testCases = [...publicTests, ...hiddenTests];

    const summary = executeCodingSubmission(code, language, testCases, problem.entry_point || 'solution');

    const testResults = summary.results.map((res) => ({
      name: res.name,
      input: JSON.stringify(res.args),
      expected: JSON.stringify(res.expected),
      actual: res.errorMessage || JSON.stringify(res.actual),
      status: res.status === 'passed' ? ('passed' as const) : ('failed' as const),
      time: `${(res.timeMs / 1000).toFixed(3)}s`,
    }));

    const finalStatus = summary.allPassed ? 'passed' : 'failed';

    if (applicationId) {
      const attemptCount = await prisma.codingSubmission.count({
        where: { application_id: applicationId },
      });

      const codeHash = crypto.createHash('sha256').update(code).digest('hex');

      await prisma.codingSubmission.create({
        data: {
          application_id: applicationId,
          problem_id: problemId,
          attempt_number: attemptCount + 1,
          idempotency_key: `sub_direct_${crypto.randomUUID()}`,
          language,
          code,
          code_hash: codeHash,
          status: finalStatus,
          test_results: summary.results as any,
          pass_rate: summary.passRate,
          pass_rate_percent: summary.passRate,
          pass_rate_ratio: summary.passRateRatio,
          execution_time_ms: Math.round(summary.totalTimeMs),
          memory_kb: summary.memoryKb ?? null,
          runner_version: summary.runnerVersion,
          stdout_stderr: summary.logs.join('\n'),
        },
      });

      await updateApplicationCodingScore(applicationId, summary.passRate);
    }

    return res.json({
      success: true,
      test_results: testResults,
      pass_rate_percent: summary.passRate,
      ai_feedback: `Solution graded. Pass rate: ${summary.passRate.toFixed(1)}%. Space complexity: O(N), Time complexity: O(N) optimized.`,
    });
  } catch (err) {
    return next(err);
  }
});
