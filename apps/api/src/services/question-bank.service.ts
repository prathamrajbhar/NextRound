import { prisma } from '../lib/prisma';
import { badRequest } from '../lib/http-errors';
import { logger } from '../lib/logger';

export interface SelectedAptitudeQuestion {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  text: string;
  options: string[];
  correct_index: number;
}

export type PublicAptitudeQuestion = Omit<SelectedAptitudeQuestion, 'correct_index'>;

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

export interface SelectAptitudeOptions {
  distribution: Record<string, number>;
  difficulty?: 'easy' | 'medium' | 'hard';
  excludeIds?: string[];
}

export interface SelectCodingOptions {
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
}

export async function selectAptitudeQuestions(
  opts: SelectAptitudeOptions,
): Promise<SelectedAptitudeQuestion[]> {
  const { distribution, difficulty, excludeIds = [] } = opts;
  const results: SelectedAptitudeQuestion[] = [];
  const usedIds = new Set<string>(excludeIds);

  for (const [category, count] of Object.entries(distribution)) {
    if (count <= 0) continue;

    let pool = await prisma.aptitudeQuestion.findMany({
      where: {
        category,
        is_active: true,
        ...(difficulty ? { difficulty } : {}),
        id: usedIds.size > 0 ? { notIn: [...usedIds] } : undefined,
      },
      take: Math.min(count * 5, 200),
    });

    if (pool.length < count && difficulty) {
      const extraCount = count - pool.length;
      const excludePoolIds = [...usedIds, ...pool.map((q) => q.id)];
      const extraPool = await prisma.aptitudeQuestion.findMany({
        where: {
          category,
          is_active: true,
          id: excludePoolIds.length > 0 ? { notIn: excludePoolIds } : undefined,
        },
        take: Math.min(extraCount * 5, 200),
      });
      pool = [...pool, ...extraPool];
    }

    if (pool.length === 0) {
      logger
        .child('QuestionBank')
        .warn(
          `No questions for "${category}"` +
            (difficulty ? ` (${difficulty})` : '') +
            `. Skipping. Seed the DB to include this category.`,
        );
      continue;
    }

    const actualCount = Math.min(count, pool.length);
    if (pool.length < count) {
      logger
        .child('QuestionBank')
        .warn(
          `Only ${pool.length}/${count} available for "${category}"` +
            (difficulty ? ` (${difficulty})` : '') +
            `. Using all available.`,
        );
    }

    const selected = shuffleInPlace([...pool]).slice(0, actualCount);
    for (const q of selected) {
      usedIds.add(q.id);
      results.push({
        id: q.id,
        category: q.category,
        difficulty: q.difficulty,
        question: q.question,
        text: q.question,
        options: q.options as string[],
        correct_index: q.correct_index,
      });
    }
  }

  return results;
}

export function toPublicAptitudeQuestions(
  questions: SelectedAptitudeQuestion[],
): PublicAptitudeQuestion[] {
  return questions.map(({ correct_index, ...pub }) => pub);
}

export function buildAptitudeDistribution(
  totalCount: number,
  mcqDistribution?: Record<string, number>,
): Record<string, number> {
  if (mcqDistribution && Object.keys(mcqDistribution).length > 0) {
    return mcqDistribution;
  }

  const CATS = [
    'Quantitative Aptitude',
    'Logical Reasoning',
    'Verbal Ability',
    'Data Interpretation',
  ] as const;

  const base = Math.floor(totalCount / 4);
  const rem = totalCount % 4;
  const dist: Record<string, number> = {};

  CATS.forEach((cat, i) => {
    dist[cat] = base + (i < rem ? 1 : 0);
  });

  return dist;
}

export async function selectCodingProblem(
  opts: SelectCodingOptions = {},
): Promise<SelectedCodingProblem> {
  const { difficulty, category } = opts;

  const pool = await prisma.codingProblem.findMany({
    where: {
      is_active: true,
      ...(difficulty ? { difficulty } : {}),
      ...(category   ? { category }   : {}),
    },
    take: 50,
  });

  if (pool.length === 0) {
    throw badRequest(
      `No active coding problems found` +
        (difficulty ? ` at difficulty "${difficulty}"` : '') +
        (category   ? ` in category "${category}"`     : '') +
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
      ...publicTests.map(tc => ({ ...tc, hidden: false })),
      ...hiddenTests.map(tc => ({ ...tc, hidden: true  })),
    ],
    expectedComplexity: null,
  };
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
