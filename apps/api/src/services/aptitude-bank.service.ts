import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { shuffleInPlace } from './question-bank.helpers';

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

export interface SelectAptitudeOptions {
  distribution: Record<string, number>;
  difficulty?: 'easy' | 'medium' | 'hard';
  excludeIds?: string[];
}

export async function selectAptitudeQuestions(
  options: SelectAptitudeOptions,
): Promise<SelectedAptitudeQuestion[]> {
  const { distribution, difficulty, excludeIds = [] } = options;
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
    for (const question of selected) {
      usedIds.add(question.id);
      results.push({
        id: question.id,
        category: question.category,
        difficulty: question.difficulty,
        question: question.question,
        text: question.question,
        options: question.options as string[],
        correct_index: question.correct_index,
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

  const categories = [
    'Quantitative Aptitude',
    'Logical Reasoning',
    'Verbal Ability',
    'Data Interpretation',
  ] as const;

  const base = Math.floor(totalCount / 4);
  const remainder = totalCount % 4;
  const distribution: Record<string, number> = {};

  categories.forEach((category, index) => {
    distribution[category] = base + (index < remainder ? 1 : 0);
  });

  return distribution;
}
