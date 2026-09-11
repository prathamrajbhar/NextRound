'use client';

import React, { useState, useEffect } from 'react';
import { useCodingProblem, type SupportedLanguage } from './coding/useCodingProblem';
import { useCodingExecution } from './coding/useCodingExecution';
import { CodingStateScreen } from './coding/CodingStateScreen';
import { CodingHeader } from './coding/CodingHeader';
import { CodingProblemPanel, type CodingLeftTab } from './coding/CodingProblemPanel';
import { CodingWorkspacePanel, type CodingBottomTab } from './coding/CodingWorkspacePanel';
import { CodingSubmissionSummary } from './coding/CodingSubmissionSummary';
import { ProctoringWarningModal } from './ProctoringWarningModal';
import { CodingStartCard } from './coding/CodingStartCard';
import { RecordingBadge } from './RecordingBadge';
import type { CodingConsoleProps } from './coding/codingConsole.types';

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
  recordingActive = false,
  recordingDurationMs = 0,
}: CodingConsoleProps) {
  const { problem, error } = useCodingProblem({ applicationId, sessionId, role, company });

  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState<string>('');
  const [activeLeftTab, setActiveLeftTab] = useState<CodingLeftTab>('description');
  const [activeBottomTab, setActiveBottomTab] = useState<CodingBottomTab>('testcases');
  const [strikeCount, setStrikeCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const {
    isRunning,
    submitted,
    setSubmitted,
    outputLogs,
    testResults,
    complexityFeedback,
    finalPassRate,
    runCode,
    submitSolution,
  } = useCodingExecution({ problem, applicationId });

  useEffect(() => {
    if (proctoringClient || !problem || submitted || !isStarted) return;

    const handleVisibilityViolation = () => {
      if (document.hidden) {
        setStrikeCount((prev) => {
          const next = prev + 1;
          setShowWarningModal(true);
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityViolation);
    return () => document.removeEventListener('visibilitychange', handleVisibilityViolation);
  }, [proctoringClient, problem, submitted, isStarted]);

  useEffect(() => {
    if (problem?.starterCode[language]) {
      setCode(problem.starterCode[language]);
    }
  }, [problem, language]);

  const handleStartCodingRound = () => {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setIsStarted(true);
  };

  const handleResumeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
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

  const displayStrikeCount = outerStrikeCount !== undefined ? outerStrikeCount : strikeCount;
  const displayShowWarning = outerWarningModal !== undefined ? outerWarningModal : showWarningModal;
  const displayResumeFullscreen =
    outerResumeFullscreen !== undefined ? outerResumeFullscreen : handleResumeFullscreen;

  if (error) return <CodingStateScreen error={error} />;
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
      <CodingHeader
        company={company}
        role={role}
        problem={problem}
        language={language}
        isRunning={isRunning}
        onLanguageChange={handleLanguageChange}
        onRun={() => runCode(code, language, () => setActiveBottomTab('results'))}
        onSubmit={() => submitSolution(code, language, () => setShowWarningModal(false))}
      />

      {!submitted ? (
        <>
          <RecordingBadge active={recordingActive} durationMs={recordingDurationMs} />
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
        </>
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

      <ProctoringWarningModal
        isOpen={displayShowWarning && !submitted}
        strikeCount={displayStrikeCount}
        onResumeFullscreen={displayResumeFullscreen}
        onEliminate={handleEliminateCandidate}
      />
    </div>
  );
}
