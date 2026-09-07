import { apiClient } from '@/lib/apiClient';
import { computeAptitudeScore } from './scoring';
import type { AptitudeQuestion } from './useAptitudeQuestions';

export async function submitAptitudeAssessment(params: {
  applicationId?: string;
  answers: Record<string, number>;
  activeQuestions: AptitudeQuestion[];
  timeLeft: number;
  totalTimeLimit: number;
  strikeCount: number;
}): Promise<number> {
  const { applicationId, answers, activeQuestions, timeLeft, totalTimeLimit, strikeCount } = params;

  if (applicationId) {
    const formattedAnswers = Object.entries(answers).map(([qId, sel]) => ({
      questionId: qId,
      selectedOption: sel,
    }));
    const res = await apiClient.post<{ score?: number }>(
      `/applications/${applicationId}/assessment/aptitude`,
      {
        answers: formattedAnswers,
        totalTimeSeconds: totalTimeLimit - timeLeft,
        tabSwitchCount: strikeCount,
      }
    );
    if (res && typeof res.score === 'number') {
      return Math.max(0, Math.min(100, Math.round(res.score)));
    }
  }

  return computeAptitudeScore(answers, activeQuestions);
}

export function computeCategoryScore(
  categoryQuestions: AptitudeQuestion[],
  answers: Record<string, number>
): number {
  let correct = 0;
  categoryQuestions.forEach((q) => {
    if (q.correctIndex !== undefined && answers[q.id] === q.correctIndex) {
      correct++;
    }
  });
  return categoryQuestions.length > 0 ? Math.round((correct / categoryQuestions.length) * 100) : 100;
}

export function prepareActiveQuestions(
  fetched: AptitudeQuestion[],
  fallback: AptitudeQuestion[],
  normalizeFn: (cat: string) => string,
  categories: readonly string[]
): AptitudeQuestion[] {
  const list = fetched.length > 0 ? fetched : fallback;
  return list
    .map((q) => ({
      ...q,
      category: normalizeFn(q.category),
    }))
    .sort((a, b) => {
      const idxA = categories.indexOf(a.category);
      const idxB = categories.indexOf(b.category);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
}
