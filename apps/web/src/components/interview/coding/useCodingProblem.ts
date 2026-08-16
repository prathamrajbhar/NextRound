'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { normalizeCodingProblem, pickCodingEndpoint } from './normalize';

export type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'java' | 'cpp';

export const LANGUAGES: SupportedLanguage[] = ['python', 'javascript', 'typescript', 'java', 'cpp'];

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  starterCode: Record<SupportedLanguage, string>;
  testCases: { name: string; input: string; expected: string; hidden?: boolean }[];
  editorial: string;
  expectedComplexity: { time: string; space: string } | null;
}

interface UseCodingProblemOptions {
  applicationId?: string;
  sessionId?: string;
  role: string;
  company: string;
}

export function useCodingProblem({ applicationId, sessionId, role, company }: UseCodingProblemOptions) {
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchCodingProblem() {
      try {
        const endpoint = pickCodingEndpoint({ applicationId, sessionId, role, company });

        const res = await apiClient.get<{ problem: Record<string, unknown> }>(endpoint);
        if (cancelled) return;
        if (res?.problem) {
          setProblem(normalizeCodingProblem(res.problem as Record<string, unknown>));
          setError(null);
        } else {
          throw new Error('No coding problem found in the question bank. Contact your administrator.');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load coding problem. Please refresh and try again.');
        }
      }
    }
    fetchCodingProblem();
    return () => { cancelled = true; };
  }, [applicationId, sessionId, role, company]);

  return { problem, error };
}
