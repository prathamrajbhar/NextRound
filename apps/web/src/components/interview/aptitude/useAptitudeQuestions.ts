'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

export interface AptitudeQuestion {
  id: string;
  category: string;
  text: string;
  options: string[];
  difficulty?: string;
  correctIndex?: number;
}

interface RawApiQuestion {
  id?: string;
  category?: string;
  text?: string;
  question?: string;
  options?: string[];
  difficulty?: string;
  /** correct_index (real assessments, stripped) or correctIndex (mock/practice) */
  correctIndex?: number;
  correct_index?: number;
}

export const STANDARD_CATEGORIES = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
] as const;

export function normalizeCategory(rawCat?: string, index: number = 0): string {
  if (!rawCat) return STANDARD_CATEGORIES[index % 4];
  const cat = rawCat.trim();
  if ((STANDARD_CATEGORIES as readonly string[]).includes(cat)) return cat;
  const lower = cat.toLowerCase();
  if (lower.includes('quant') || lower.includes('math') || lower.includes('arithmetic')) return 'Quantitative Aptitude';
  if (lower.includes('logic') || lower.includes('reason') || lower.includes('deduction')) return 'Logical Reasoning';
  if (lower.includes('verbal') || lower.includes('english') || lower.includes('grammar')) return 'Verbal Ability';
  if (lower.includes('data') || lower.includes('chart') || lower.includes('graph') || lower.includes('interpretation')) return 'Data Interpretation';
  return STANDARD_CATEGORIES[index % 4];
}

interface UseAptitudeQuestionsOptions {
  applicationId?: string;
  sessionId?: string;
  role: string;
  company: string;
}

function normalizeQuestion(q: RawApiQuestion, idx: number): AptitudeQuestion {
  return {
    id: q.id || `q_${idx}`,
    category: normalizeCategory(q.category, idx),
    text: q.text || q.question || 'Question unavailable.',
    options: q.options || [],
    difficulty: q.difficulty || 'medium',
    correctIndex: q.correctIndex ?? q.correct_index,
  };
}

/**
 * Fetches aptitude questions from the server.
 * The server selects randomly from the DB question bank — no category/batch
 * params needed. One request returns the full set for this session.
 */
export function useAptitudeQuestions({
  applicationId,
  sessionId,
  role,
  company,
}: UseAptitudeQuestionsOptions) {
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // isPrefetching kept for API compatibility with useAptitudeSession
  const [isPrefetching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      apiClient.clearCache('/aptitude');
      setIsLoading(true);
      setFetchError(null);

      try {
        const endpoint = applicationId
          ? `/applications/${applicationId}/assessment/aptitude`
          : `/mock/sessions/${sessionId || 'practice'}/aptitude?role=${encodeURIComponent(role)}&company=${encodeURIComponent(company)}`;

        const res = await apiClient.get<{ questions: RawApiQuestion[] }>(endpoint);

        if (cancelled) return;

        if (res?.questions && Array.isArray(res.questions) && res.questions.length > 0) {
          setQuestions(res.questions.map(normalizeQuestion));
        } else {
          setFetchError('No questions returned from server.');
          setQuestions([]);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load questions.';
          // 401 means session expired — give a clear actionable message
          const isAuth = msg.toLowerCase().includes('401') || msg.toLowerCase().includes('authentication') || msg.toLowerCase().includes('token');
          setFetchError(isAuth
            ? 'Your session has expired. Please log in again to start the assessment.'
            : `Could not load questions: ${msg}`
          );
          setQuestions([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [applicationId, sessionId, role, company]);

  // No-op: questions are fully loaded in one shot from the DB
  const prefetchNextBatch = useCallback(async () => {}, []);

  return { questions, isLoading, isPrefetching, prefetchNextBatch, fetchError };
}
