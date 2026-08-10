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

export interface RawApiQuestion {
  id?: string;
  category?: string;
  text?: string;
  question?: string;
  options?: string[];
  difficulty?: string;
  correctIndex?: number;
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
  if (
    lower.includes('quant') ||
    lower.includes('math') ||
    lower.includes('arithmetic') ||
    lower.includes('throughput') ||
    lower.includes('latency') ||
    lower.includes('rate') ||
    lower.includes('system')
  ) {
    return 'Quantitative Aptitude';
  }
  if (
    lower.includes('logic') ||
    lower.includes('reason') ||
    lower.includes('deduction') ||
    lower.includes('algo') ||
    lower.includes('complexity')
  ) {
    return 'Logical Reasoning';
  }
  if (
    lower.includes('verbal') ||
    lower.includes('english') ||
    lower.includes('language') ||
    lower.includes('grammar') ||
    lower.includes('vocab') ||
    lower.includes('text')
  ) {
    return 'Verbal Ability';
  }
  if (
    lower.includes('data') ||
    lower.includes('chart') ||
    lower.includes('graph') ||
    lower.includes('stat') ||
    lower.includes('table') ||
    lower.includes('interpretation') ||
    lower.includes('pipeline')
  ) {
    return 'Data Interpretation';
  }
  return STANDARD_CATEGORIES[index % 4];
}

interface UseAptitudeQuestionsOptions {
  applicationId?: string;
  sessionId?: string;
  role: string;
  company: string;
}

/**
 * Owns aptitude question loading: the initial batch fetch plus background
 * prefetching of follow-up batches for mock sessions. Also normalizes raw API
 * questions into the local `AptitudeQuestion` shape used by the console.
 */
export function useAptitudeQuestions({ applicationId, sessionId, role, company }: UseAptitudeQuestionsOptions) {
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [batchCount, setBatchCount] = useState(1);

  // 1. Initial Batch Direct Fetch
  useEffect(() => {
    async function loadInitialBatch() {
      apiClient.clearCache('/aptitude');
      const endpoint = applicationId
        ? `/applications/${applicationId}/assessment/aptitude`
        : `/mock/sessions/${sessionId || 'practice'}/aptitude?role=${encodeURIComponent(role)}&company=${encodeURIComponent(company)}&batch=1&count=4`;

      try {
        setIsLoading(true);
        const res = await apiClient.get<{ questions: RawApiQuestion[] }>(endpoint).catch(() => null);
        if (res?.questions && Array.isArray(res.questions) && res.questions.length > 0) {
          const mapped = res.questions.map((q: RawApiQuestion, idx: number) => ({
            id: q.id || `q_b1_${idx}`,
            category: normalizeCategory(q.category, idx),
            text: q.text || q.question || 'Question text unavailable.',
            options: q.options || [],
            difficulty: q.difficulty || 'medium',
            correctIndex: q.correctIndex,
          }));
          setQuestions(mapped);
        }
      } catch (err) {
        console.error('Failed to load initial aptitude questions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialBatch();
  }, [applicationId, sessionId, role, company]);

  // 2. Background Batch Prefetching
  const prefetchNextBatch = useCallback(async () => {
    if (isPrefetching || isLoading || applicationId) return;

    const nextBatchNum = batchCount + 1;
    const prefetchEndpoint = `/mock/sessions/${sessionId || 'practice'}/aptitude?role=${encodeURIComponent(role)}&company=${encodeURIComponent(company)}&batch=${nextBatchNum}&count=4`;

    try {
      setIsPrefetching(true);
      const res = await apiClient.get<{ questions: RawApiQuestion[] }>(prefetchEndpoint).catch(() => null);
      if (res?.questions && Array.isArray(res.questions) && res.questions.length > 0) {
        const newMapped = res.questions.map((q: RawApiQuestion, idx: number) => ({
          id: `${q.id || 'q'}_b${nextBatchNum}_${idx}`,
          category: normalizeCategory(q.category, idx),
          text: q.text || q.question || 'Question text unavailable.',
          options: q.options || [],
          difficulty: q.difficulty || 'medium',
          correctIndex: q.correctIndex,
        }));
        setQuestions((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const uniqueNew = newMapped.filter((item: AptitudeQuestion) => !existingIds.has(item.id));
          return [...prev, ...uniqueNew];
        });
        setBatchCount(nextBatchNum);
      }
    } catch (err) {
      console.error(`Failed to prefetch aptitude batch ${nextBatchNum}:`, err);
    } finally {
      setIsPrefetching(false);
    }
  }, [isPrefetching, isLoading, applicationId, batchCount, sessionId, role, company]);

  return { questions, isLoading, isPrefetching, prefetchNextBatch };
}
