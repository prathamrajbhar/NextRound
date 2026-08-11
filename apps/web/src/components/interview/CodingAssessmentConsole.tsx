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
import { CodingStartCard } from './coding/CodingStartCard';
import type { TestResult } from './coding/types';

import type { ProctoringClient } from '@/lib/proctoring/ProctoringClient';

interface CodingConsoleProps {
  company?: string;
  role?: string;
  applicationId?: string;
  sessionId?: string;
  onComplete: (score: number) => void;
  proctoringClient?: ProctoringClient | null;
  strikeCount?: number;
  showWarningModal?: boolean;
  onResumeFullscreen?: () => void;
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
  proctoringClient,
  strikeCount: outerStrikeCount,
  showWarningModal: outerWarningModal,
  onResumeFullscreen: outerResumeFullscreen,
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
  const [isStarted, setIsStarted] = useState(false);

  // Anti-Cheat proctoring listeners for coding round (runs only after starting)
  useEffect(() => {
    if (proctoringClient || !problem || submitted || !isStarted) return;

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
  }, [proctoringClient, problem, submitted, isStarted]);

  const handleStartCodingRound = () => {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    }
    setIsStarted(true);
  };

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

  // Synchronize starter code once the dynamic LLM problem loads
  useEffect(() => {
    if (problem?.starterCode[language]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode(problem.starterCode[language]);
    }
  }, [problem, language]);

  const handleRunCode = async () => {
    if (!problem || isRunning) return;
    setIsRunning(true);
    setOutputLogs(['Running test cases against Python sandbox environment...']);
    setTestResults([]);

    try {
      const res = await apiClient.post<{ stdout_stderr: string; test_results?: TestResult[] }>(`/coding/run`, {
        code,
        language,
        problemId: problem.id,
      });

      setOutputLogs([
        res.stdout_stderr ? `=== Sandbox Output ===\n${res.stdout_stderr}` : 'Code executed with no stdout/stderr output.',
      ]);
      setTestResults(res.test_results || []);
      setActiveBottomTab('results');
    } catch (err: unknown) {
      setOutputLogs([`[Runtime Sandbox Error] ${(err as Error).message || 'Execution failed'}`]);
      setActiveBottomTab('results');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!problem || isRunning) return;
    setIsRunning(true);
    setOutputLogs(['Submitting final solution for pipeline score grading...']);

    try {
      const res = await apiClient.post<{ test_results?: TestResult[]; pass_rate_percent?: number; ai_feedback?: string; complexity?: string }>(`/coding/submit`, {
        code,
        language,
        problemId: problem.id,
        applicationId,
      });

      setTestResults(res.test_results || []);
      setFinalPassRate(res.pass_rate_percent || 0);
      setComplexityFeedback(res.ai_feedback || res.complexity || 'O(N) Optimization evaluated.');
      setSubmitted(true);
    } catch (err: unknown) {
      setOutputLogs([`[Submission Error] ${(err as Error).message || 'Failed to submit solution'}`]);
      setActiveBottomTab('results');
    } finally {
      setIsRunning(false);
    }
  };

  const displayStrikeCount = outerStrikeCount !== undefined ? outerStrikeCount : strikeCount;
  const displayShowWarning = outerWarningModal !== undefined ? outerWarningModal : showWarningModal;
  const displayResumeFullscreen = outerResumeFullscreen !== undefined ? outerResumeFullscreen : handleResumeFullscreen;

  if (error) {
    return <CodingStateScreen error={error} />;
  }

  if (!problem) {
    return <CodingStateScreen loadingLabel="Preparing Coding Lab. Vetting custom dynamic questions..." />;
  }

  if (!isStarted) {
    return (
      <CodingStartCard
        company={company}
        role={role}
        problemTitle={problem.title}
        difficulty={problem.difficulty}
        category={problem.category}
        onStart={handleStartCodingRound}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Dynamic Header */}
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
        isOpen={displayShowWarning}
        strikeCount={displayStrikeCount}
        onResumeFullscreen={displayResumeFullscreen}
        onEliminate={handleEliminateCandidate}
      />
    </div>
  );
}
