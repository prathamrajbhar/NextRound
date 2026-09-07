import { Request, Response, NextFunction } from 'express';
import { prisma, Prisma } from '@nextround/database';
import { selectCodingProblem } from '../../services/questions/question-bank.service';
import { getCandidateProfileId } from '../../lib/candidate-profile';
import { normalizeDifficulty } from './mock-aptitude.controller';

export async function getMockCoding(req: Request, res: Response, next: NextFunction) {
  try {
    const candidateId = await getCandidateProfileId(req.user!.userId);
    const session = await prisma.mockSession.findFirst({
      where: { id: req.params.id as string, candidate_id: candidateId },
    });

    const rawDiff = normalizeDifficulty(session?.difficulty);

    const existing = await prisma.assessment.findFirst({
      where: { session_id: session?.id, test_type: 'coding' },
    });

    let problem: Record<string, unknown>;
    if (existing?.questions && typeof existing.questions === 'object') {
      problem = existing.questions as Record<string, unknown>;
    } else {
      const selected = await selectCodingProblem({
        difficulty: rawDiff,
      });
      problem = selected as unknown as Record<string, unknown>;

      if (session) {
        await prisma.assessment.create({
          data: {
            session_id: session.id,
            test_type: 'coding',
            questions: problem as Prisma.InputJsonValue,
            status: 'in_progress',
          },
        });
      }
    }

    const rawTestCases = Array.isArray(problem.testCases) ? problem.testCases : [];
    const sanitizedProblem = {
      ...problem,
      testCases: rawTestCases.filter((tc: Record<string, unknown>) => !tc.hidden),
    };

    return res.json({ success: true, data: { problem: sanitizedProblem } });
  } catch (error) {
    return next(error);
  }
}
