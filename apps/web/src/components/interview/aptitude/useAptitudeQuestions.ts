'use client';

import { useState, useEffect } from 'react';
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
  
  correctIndex?: number;
  correct_index?: number;
}

export const STANDARD_CATEGORIES = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
] as const;

export function normalizeCategory(rawCat?: string): string {
  if (!rawCat || !rawCat.trim()) {
    throw new Error('Question is missing required field: category');
  }
  const cat = rawCat.trim();
  if ((STANDARD_CATEGORIES as readonly string[]).includes(cat)) return cat;
  const lower = cat.toLowerCase();
  if (lower.includes('quant') || lower.includes('math') || lower.includes('arithmetic')) return 'Quantitative Aptitude';
  if (lower.includes('logic') || lower.includes('reason') || lower.includes('deduction')) return 'Logical Reasoning';
  if (lower.includes('verbal') || lower.includes('english') || lower.includes('grammar')) return 'Verbal Ability';
  if (lower.includes('data') || lower.includes('chart') || lower.includes('graph') || lower.includes('interpretation')) return 'Data Interpretation';
  throw new Error(`Question has an unrecognized category: "${rawCat}"`);
}

interface UseAptitudeQuestionsOptions {
  applicationId?: string;
  sessionId?: string;
  role: string;
  company: string;
}

export function normalizeQuestion(q: RawApiQuestion): AptitudeQuestion {
  const id = q.id;
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('Question is missing required field: id');
  }
  const text = q.text || q.question;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error(`Question "${id}" is missing required field: text`);
  }
  const options = q.options;
  if (!Array.isArray(options) || options.length === 0) {
    throw new Error(`Question "${id}" is missing required field: options`);
  }
  return {
    id,
    category: normalizeCategory(q.category),
    text,
    options,
    difficulty: q.difficulty,
    correctIndex: q.correctIndex ?? q.correct_index,
  };
}






export function useAptitudeQuestions({
  applicationId,
  sessionId,
  role,
  company,
}: UseAptitudeQuestionsOptions) {
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [mcqDistribution, setMcqDistribution] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

        const res = await apiClient.get<{ questions: RawApiQuestion[]; mcqDistribution?: Record<string, number> }>(endpoint);

        if (cancelled) return;

        if (res?.questions && Array.isArray(res.questions) && res.questions.length > 0) {
          setQuestions(res.questions.map((q) => normalizeQuestion(q)));
          if (res.mcqDistribution) {
            setMcqDistribution(res.mcqDistribution);
          }
        } else {
          setFetchError('No questions returned from server.');
          setQuestions([]);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load questions.';
          
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

  
  return { questions, mcqDistribution, isLoading, fetchError };
}
