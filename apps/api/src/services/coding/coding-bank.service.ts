import { prisma } from '../../lib/prisma';
import { badRequest } from '../../lib/http-errors';
import { shuffleInPlace } from '../questions/question-bank.helpers';

export interface SelectedCodingProblem {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  description: string;
  starterCode: Record<string, string>;
  testCases: Array<{
    input: unknown;
    expected: unknown;
    description?: string;
    hidden: boolean;
  }>;
  expectedComplexity: { time: string; space: string } | null;
}

export interface SelectCodingOptions {
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
}

export async function selectCodingProblem(
  options: SelectCodingOptions = {},
): Promise<SelectedCodingProblem> {
  const { difficulty, category } = options;

  const pool = await prisma.codingProblem.findMany({
    where: {
      is_active: true,
      ...(difficulty ? { difficulty } : {}),
      ...(category ? { category } : {}),
    },
    take: 50,
  });

  if (pool.length === 0) {
    throw badRequest(
      `No active coding problems found` +
        (difficulty ? ` at difficulty "${difficulty}"` : '') +
        (category ? ` in category "${category}"` : '') +
        `. Seed the database before running assessments.`,
    );
  }

  const problem = shuffleInPlace([...pool])[0];

  const publicTests = (
    Array.isArray(problem.public_tests) ? problem.public_tests : []
  ) as Array<{ input: unknown; expected: unknown; description?: string }>;

  const hiddenTests = (
    Array.isArray(problem.hidden_tests) ? problem.hidden_tests : []
  ) as Array<{ input: unknown; expected: unknown; description?: string }>;

  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    category: problem.category,
    difficulty: problem.difficulty,
    description: problem.description,
    starterCode: (problem.starter_code as Record<string, string>) ?? {},
    testCases: [
      ...publicTests.map((testCase) => ({ ...testCase, hidden: false })),
      ...hiddenTests.map((testCase) => ({ ...testCase, hidden: true })),
    ],
    expectedComplexity: null,
  };
}
