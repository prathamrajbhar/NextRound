import { Router, Request, Response, NextFunction } from 'express';
import { generateAiCodingProblem } from '../../services/ai-coding-generator.service';
import { enqueueSubmissionExecution } from '../../services/submission-queue.service';
import { authenticate } from '../../middleware/auth';
import { CodingExecutionRequestSchema } from '@nextround/shared';

export const codingRouter = Router();

// GET /api/v1/coding/problem - Generate & persist immutable DSA coding problem
codingRouter.get('/problem', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = (req.query.role as string) || 'Software Engineer';
    const company = (req.query.company as string) || 'Tech Enterprise';
    const difficulty = (req.query.difficulty as string) || 'medium';

    const problem = await generateAiCodingProblem(role, `Target Company: ${company}`, difficulty);

    return res.json({
      success: true,
      data: { problem },
    });
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
