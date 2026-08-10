'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

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
  expectedComplexity: { time: string; space: string };
}

interface UseCodingProblemOptions {
  applicationId?: string;
  sessionId?: string;
  role: string;
  company: string;
}

/**
 * Loads a coding problem from the backend DB question bank and normalizes the
 * API payload into the local `CodingProblem` shape.
 */
export function useCodingProblem({ applicationId, sessionId, role, company }: UseCodingProblemOptions) {
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchCodingProblem() {
      try {
        const endpoint = applicationId
          ? `/applications/${applicationId}/assessment/coding`
          : sessionId
          ? `/mock/sessions/${sessionId}/coding`
          : `/coding/problem?role=${encodeURIComponent(role || 'Software Engineer')}&company=${encodeURIComponent(company || 'Tech Enterprise')}`;

        const res = await apiClient.get<{ problem: Record<string, unknown> }>(endpoint);
        if (cancelled) return;
        if (res?.problem) {
          const p = res.problem as Record<string, unknown>;
          const rawTestCases = Array.isArray(p.testCases) ? p.testCases : [];
          const loaded: CodingProblem = {
            id: typeof p.id === 'string' ? p.id : 'db-problem',
            title: typeof p.title === 'string' ? p.title : 'Coding Problem',
            difficulty: (typeof p.difficulty === 'string'
              ? p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1).toLowerCase()
              : 'Medium') as CodingProblem['difficulty'],
            category: typeof p.category === 'string' ? p.category : 'Algorithms',
            description: typeof p.description === 'string' ? p.description : '',
            constraints: Array.isArray(p.constraints) ? (p.constraints as string[]) : [],
            examples: Array.isArray(p.examples) ? (p.examples as CodingProblem['examples']) : [],
            starterCode: {
              python:     (p.starterCode as Record<string, string>)?.python     || '',
              javascript: (p.starterCode as Record<string, string>)?.javascript || '',
              typescript: (p.starterCode as Record<string, string>)?.typescript || '',
              java:       (p.starterCode as Record<string, string>)?.java       || '',
              cpp:        (p.starterCode as Record<string, string>)?.cpp        || '',
            },
            testCases: rawTestCases.map((tc: Record<string, unknown>, i: number) => ({
              name:     typeof tc.name     === 'string' ? tc.name     : `Case ${i + 1}`,
              input:    typeof tc.input    === 'string' ? tc.input    :
                        tc.input !== undefined           ? JSON.stringify(tc.input) : '',
              expected: typeof tc.expected === 'string' ? tc.expected :
                        typeof tc.expectedOutput === 'string' ? tc.expectedOutput :
                        tc.expected !== undefined ? JSON.stringify(tc.expected) : '',
              hidden: Boolean(tc.hidden),
            })),
            editorial: typeof p.editorial === 'string' ? p.editorial : '',
            expectedComplexity:
              (p.expectedComplexity as CodingProblem['expectedComplexity']) ||
              { time: 'O(n)', space: 'O(1)' },
          };
          setProblem(loaded);
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
