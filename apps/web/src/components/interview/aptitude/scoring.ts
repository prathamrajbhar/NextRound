import type { AptitudeQuestion } from './useAptitudeQuestions';

export function computeAptitudeScore(
  answers: Record<string, number>,
  questions: AptitudeQuestion[]
): number {
  if (questions.length === 0) return 0;
  let correct = 0;
  for (const q of questions) {
    if (q.correctIndex !== undefined && answers[q.id] === q.correctIndex) {
      correct++;
    }
  }
  return Math.round((correct / questions.length) * 100);
}

export function resolveCategoryQuestionCount(
  mcqDistribution: Record<string, number> | null,
  questions: AptitudeQuestion[],
  category: string
): number {
  if (mcqDistribution && typeof mcqDistribution[category] === 'number') {
    return mcqDistribution[category];
  }

  return questions.filter((q) => q.category === category).length;
}