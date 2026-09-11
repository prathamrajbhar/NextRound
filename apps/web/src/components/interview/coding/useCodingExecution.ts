import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { CodingProblem, SupportedLanguage } from './useCodingProblem';
import type { TestResult } from './types';

interface UseCodingExecutionOptions {
  problem: CodingProblem | null;
  applicationId?: string;
}

export function useCodingExecution({ problem, applicationId }: UseCodingExecutionOptions) {
  const [isRunning, setIsRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [complexityFeedback, setComplexityFeedback] = useState<string | null>(null);
  const [finalPassRate, setFinalPassRate] = useState(0);

  const runCode = async (
    code: string,
    language: SupportedLanguage,
    onFinish: () => void
  ) => {
    if (!problem || isRunning) return;
    setIsRunning(true);
    setOutputLogs(['Running test cases against Python sandbox environment...']);
    setTestResults([]);

    try {
      const res = await apiClient.post<{ stdout_stderr: string; test_results?: TestResult[] }>(
        `/coding/run`,
        {
          code,
          language,
          problemId: problem.id,
        }
      );

      setOutputLogs([
        res.stdout_stderr
          ? `=== Sandbox Output ===\n${res.stdout_stderr}`
          : 'Code executed with no stdout/stderr output.',
      ]);
      setTestResults(res.test_results || []);
      onFinish();
    } catch (err: unknown) {
      setOutputLogs([`[Runtime Sandbox Error] ${(err as Error).message || 'Execution failed'}`]);
      onFinish();
    } finally {
      setIsRunning(false);
    }
  };

  const submitSolution = async (
    code: string,
    language: SupportedLanguage,
    onSuccess: () => void
  ) => {
    if (!problem || isRunning) return;
    setIsRunning(true);
    setOutputLogs(['Submitting final solution for pipeline score grading...']);

    try {
      const res = await apiClient.post<{
        test_results?: TestResult[];
        pass_rate_percent?: number;
        ai_feedback?: string;
        complexity?: string;
      }>(`/coding/submit`, {
        code,
        language,
        problemId: problem.id,
        applicationId,
      });

      setTestResults(res.test_results || []);
      setFinalPassRate(res.pass_rate_percent || 0);
      setComplexityFeedback(res.ai_feedback || res.complexity || 'O(N) Optimization evaluated.');
      setSubmitted(true);
      onSuccess();
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err: unknown) {
      setOutputLogs([`[Submission Error] ${(err as Error).message || 'Failed to submit solution'}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return {
    isRunning,
    submitted,
    setSubmitted,
    outputLogs,
    testResults,
    complexityFeedback,
    finalPassRate,
    runCode,
    submitSolution,
  };
}
