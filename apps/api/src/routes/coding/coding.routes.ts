import { Router, Request, Response, NextFunction } from 'express';
import { selectCodingProblem } from '../../services/question-bank.service';
import { enqueueSubmissionExecution } from '../../services/submission-queue.service';
import { authenticate } from '../../middleware/auth';
import { CodingExecutionRequestSchema } from '@nextround/shared';

export const codingRouter = Router();

// GET /api/v1/coding/problem - Serve a random DB coding problem (mock/standalone practice)
codingRouter.get('/problem', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const difficulty = (req.query.difficulty as 'easy' | 'medium' | 'hard') || undefined;
    const category   = (req.query.category as string) || undefined;

    const problem = await selectCodingProblem({ difficulty, category });

    // Strip hidden tests before sending to client
    const sanitized = {
      ...problem,
      testCases: problem.testCases.filter(tc => !tc.hidden),
    };

    return res.json({ success: true, data: { problem: sanitized } });
  } catch (err) {
    return next(err);
  }
});

// POST /api/v1/coding/execute - Enqueue candidate code execution against server-side problem
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
