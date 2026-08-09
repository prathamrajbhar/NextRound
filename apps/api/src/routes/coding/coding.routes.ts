import { Router, Request, Response, NextFunction } from 'express';
import { generateAiCodingProblem } from '../../services/ai-coding-generator.service';
import { executeCodingSubmission } from '../../services/coding-executor.service';

export const codingRouter = Router();

// GET /api/v1/coding/problem - Generate LLM DSA coding problem
codingRouter.get('/problem', async (req: Request, res: Response, next: NextFunction) => {
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

// POST /api/v1/coding/execute - Execute candidate code in production sandbox
codingRouter.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, language, testCases } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing code string' });
    }

    const defaultCases = [
      { name: 'Case 1', input: 'heights = [50, 50, 50, 50, 50], scroll_y = 100, viewport_height = 100', expected: '[2, 3]' },
      { name: 'Case 2', input: 'heights = [30, 40, 50, 60, 70], scroll_y = 0, viewport_height = 80', expected: '[0, 2]' },
    ];

    const casesToRun = Array.isArray(testCases) && testCases.length > 0 ? testCases : defaultCases;

    const summary = executeCodingSubmission(code, language || 'python', casesToRun);

    return res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    return next(err);
  }
});
