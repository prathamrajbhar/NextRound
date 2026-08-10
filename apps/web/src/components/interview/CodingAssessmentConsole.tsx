'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useCodingProblem, type SupportedLanguage } from './coding/useCodingProblem';
import { CodingStateScreen } from './coding/CodingStateScreen';
import { CodingHeader } from './coding/CodingHeader';
import { CodingProblemPanel, type CodingLeftTab } from './coding/CodingProblemPanel';
import { CodingWorkspacePanel, type CodingBottomTab } from './coding/CodingWorkspacePanel';
import { CodingSubmissionSummary } from './coding/CodingSubmissionSummary';
import { ProctoringWarningModal } from './ProctoringWarningModal';
import type { TestResult } from './coding/types';

interface CodingConsoleProps {
  company?: string;
  role?: string;
  applicationId?: string;
  sessionId?: string;
  onComplete: (score: number) => void;
}

/**
 * Coding assessment workspace. Loads the live LLM problem (useCodingProblem),
 * owns the editor/run/submit state machine, and delegates each pane to a
 * dedicated sub-component in ./coding.
 */
export default function CodingAssessmentConsole({
  company = '',
  role = '',
  applicationId,
  sessionId,
  onComplete,
}: CodingConsoleProps) {
  const { problem, error } = useCodingProblem({ applicationId, sessionId, role, company });

  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState<string>('');
  const [activeLeftTab, setActiveLeftTab] = useState<CodingLeftTab>('description');
  const [activeBottomTab, setActiveBottomTab] = useState<CodingBottomTab>('testcases');
  const [isRunning, setIsRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [complexityFeedback, setComplexityFeedback] = useState<string | null>(null);
  const [finalPassRate, setFinalPassRate] = useState(0);
  const [strikeCount, setStrikeCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Enter fullscreen on start when problem is loaded
  useEffect(() => {
    if (problem && !submitted) {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error('Failed to enter fullscreen:', err);
        });
      }
    }
  }, [problem, submitted]);

  // Anti-Cheat proctoring listeners for coding round
  useEffect(() => {
    if (!problem || submitted) return;

    const handleProctoringViolation = () => {
      if (document.hidden || !document.fullscreenElement) {
        setStrikeCount((prev) => {
          const next = prev + 1;
          setShowWarningModal(true);
          return next;
        });
      }
    };

    document.addEventListener('fullscreenchange', handleProctoringViolation);
    document.addEventListener('visibilitychange', handleProctoringViolation);

    return () => {
      document.removeEventListener('fullscreenchange', handleProctoringViolation);
      document.removeEventListener('visibilitychange', handleProctoringViolation);
    };
  }, [problem, submitted]);

  const handleResumeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    }
    setShowWarningModal(false);
  };

  const handleEliminateCandidate = () => {
    setShowWarningModal(false);
    onComplete(0);
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    if (problem?.starterCode[newLang]) {
      setCode(problem.starterCode[newLang]);
    }
  };

  // Production Backend Sandbox Code Execution
  const handleRunCode = async () => {
    if (!problem) return;
    setIsRunning(true);
    setActiveBottomTab('results');
    setOutputLogs([
      `[Server Sandbox] Dispatching code execution to backend container...`,
      `[Server Sandbox] Language: ${language.toUpperCase()}`,
    ]);

    try {
      const publicCases = problem.testCases.filter((tc) => !tc.hidden);
      const res = await apiClient.post<{
        results: TestResult[];
        passRate: number;
        logs: string[];
      }>('/coding/execute', {
        code,
        language,
        testCases: publicCases,
      });

      if (res) {
        setTestResults(res.results || []);
        setOutputLogs(res.logs || ['[Server Sandbox] Execution completed.']);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed connecting to execution server.';
      setOutputLogs((prev) => [...prev, `[Server Error] ${msg}`]);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Solution & Compute Final Score
  const handleSubmitSolution = async () => {
    if (!problem) return;
    setIsRunning(true);
    setActiveBottomTab('results');

    try {
      if (applicationId) {
        await apiClient.post(`/applications/${applicationId}/assessment/coding`, {
          problemId: problem.id,
          code,
          language,
        }).catch(() => null);
      }

      const res = await apiClient.post<{
        results: TestResult[];
        passRate: number;
        logs: string[];
        complexity: string;
      }>('/coding/execute', {
        code,
        language,
        testCases: problem.testCases,
      });

      if (res) {
        setTestResults(res.results || []);
        setFinalPassRate(res.passRate || 0);
        setComplexityFeedback(res.complexity || `Time: ${problem.expectedComplexity.time}`);
        setOutputLogs(res.logs || []);
        setSubmitted(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission error';
      setOutputLogs((prev) => [...prev, `[Submit Error] ${msg}`]);
    } finally {
      setIsRunning(false);
    }
  };

  if (error || !problem) {
    return <CodingStateScreen error={error} />;
  }

  return (
    <div className="w-full h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 flex flex-col justify-between overflow-hidden font-sans select-none transition-colors duration-300">
      <CodingHeader
        company={company}
        role={role}
        problem={problem}
        language={language}
        isRunning={isRunning}
        onLanguageChange={handleLanguageChange}
        onRun={handleRunCode}
        onSubmit={handleSubmitSolution}
      />

      {/* 2-Panel Split Workspace */}
      {!submitted ? (
        <main className="flex-1 p-2 flex gap-2 overflow-hidden bg-slate-100 dark:bg-[#0a0a0a]">
          <CodingProblemPanel problem={problem} activeTab={activeLeftTab} onTabChange={setActiveLeftTab} />
          <CodingWorkspacePanel
            problem={problem}
            language={language}
            code={code}
            onCodeChange={setCode}
            activeBottomTab={activeBottomTab}
            onBottomTabChange={setActiveBottomTab}
            testResults={testResults}
            outputLogs={outputLogs}
          />
        </main>
      ) : (
        /* Submission Completion View */
        <CodingSubmissionSummary
          problem={problem}
          language={language}
          finalPassRate={finalPassRate}
          testResults={testResults}
          complexityFeedback={complexityFeedback}
          onReview={() => setSubmitted(false)}
          onComplete={onComplete}
        />
      )}

      {/* Fullscreen Proctoring Warning Modal */}
      <ProctoringWarningModal
        isOpen={showWarningModal}
        strikeCount={strikeCount}
        onResumeFullscreen={handleResumeFullscreen}
        onEliminate={handleEliminateCandidate}
      />
    </div>
  );
}
