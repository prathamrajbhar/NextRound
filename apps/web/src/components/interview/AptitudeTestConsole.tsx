'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAptitudeSession } from './aptitude/useAptitudeSession';
import { AptitudeStateCard } from './aptitude/AptitudeStateCard';
import { AptitudeResultScreen } from './aptitude/AptitudeResultScreen';
import { AptitudeCategoryHub } from './aptitude/AptitudeCategoryHub';
import { AptitudeQuestionScreen } from './aptitude/AptitudeQuestionScreen';
import { AlertTriangle, LogIn } from '@/lib/lucide-google-icons';
import type { AptitudeQuestion } from './aptitude/useAptitudeQuestions';

import type { ProctoringClient } from '@/lib/proctoring/ProctoringClient';

interface AptitudeTestConsoleProps {
  questions?: AptitudeQuestion[];
  companyName?: string;
  company?: string;
  role?: string;
  roleTitle?: string;
  companyLogoUrl?: string;
  onComplete: (score: number) => void;
  applicationId?: string;
  sessionId?: string;
  proctoringClient?: ProctoringClient | null;
  strikeCount?: number;
  showWarningModal?: boolean;
  onResumeFullscreen?: () => void;
}

const MAX_STRIKES = 3;

export default function AptitudeTestConsole({
  questions = [],
  companyName,
  company,
  role,
  roleTitle,
  companyLogoUrl,
  onComplete,
  applicationId,
  sessionId,
  proctoringClient,
  strikeCount,
  showWarningModal,
  onResumeFullscreen,
}: AptitudeTestConsoleProps) {
  const router = useRouter();
  const displayCompany = company || companyName || 'NextRound';
  const displayRole = role || roleTitle || 'Candidate';

  const session = useAptitudeSession({
    questions,
    applicationId,
    sessionId,
    role: displayRole,
    company: displayCompany,
    onComplete,
    disableProctoring: !!proctoringClient,
  });

  const {
    isLoading,
    fetchError,
    activeQuestions,
    availableCategories,
    activeCategoryQuestions,
    selectedCategory,
    completedCategoryScores,
    isStarted,
    currentIndex,
    setCurrentIndex,
    answers,
    timeLeft,
    questionTimeLeft,
    submitted,
    isSubmitting,
    finalScore,
    handleFinalSubmit,
    handleCategorySubmit,
    handleSelectOption,
    handleResumeFullscreen: localResumeFS,
    handleEliminateCandidate,
    handleStartCategorySection,
    getCategoryQuestionCount,
  } = session;

  const displayStrikeCount = strikeCount !== undefined ? strikeCount : session.strikeCount;
  const displayShowWarning = showWarningModal !== undefined ? showWarningModal : session.showWarningModal;
  const displayResumeFullscreen = onResumeFullscreen !== undefined ? onResumeFullscreen : localResumeFS;

  // SUBMITTED STATE
  if (submitted) {
    const isEliminated = displayStrikeCount >= MAX_STRIKES;
    return (
      <AptitudeResultScreen
        companyName={displayCompany}
        roleTitle={displayRole}
        score={finalScore ?? 0}
        isEliminated={isEliminated}
        onContinue={() => onComplete(isEliminated ? 0 : finalScore ?? 0)}
      />
    );
  }

  // LOADING STATE
  if (isLoading) {
    return (
      <AptitudeStateCard
        title="Loading Assessment Questions"
        subtitle={`Preparing category questions for ${displayRole}...`}
        spinningIcon
      />
    );
  }

  // FETCH ERROR STATE — auth failure, network error, empty questions
  if (fetchError || activeQuestions.length === 0) {
    const isAuthError = fetchError?.toLowerCase().includes('session') || fetchError?.toLowerCase().includes('log in');
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center font-sans">
        <div className="p-8 rounded-3xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 shadow-xl max-w-md w-full space-y-5">
          <div className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {isAuthError ? 'Session Expired' : 'Could Not Load Questions'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {fetchError || 'No questions were returned by the server.'}
            </p>
          </div>
          {isAuthError ? (
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              Log In Again
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // CATEGORY SELECTION HUB
  if (!selectedCategory || !isStarted) {
    return (
      <AptitudeCategoryHub
        companyName={displayCompany}
        roleTitle={displayRole}
        companyLogoUrl={companyLogoUrl}
        categories={availableCategories}
        activeQuestions={activeQuestions}
        completedCategoryScores={completedCategoryScores}
        isSubmitting={isSubmitting}
        getCategoryQuestionCount={getCategoryQuestionCount}
        onStartCategory={handleStartCategorySection}
        onFinalSubmit={handleFinalSubmit}
      />
    );
  }

  const currentQ = activeCategoryQuestions[currentIndex];
  if (!currentQ) {
    return (
      <AptitudeStateCard
        title={`Initializing ${selectedCategory}`}
        subtitle="Loading section questions..."
        actionLabel="Return to Assessment Hub"
        onAction={handleCategorySubmit}
      />
    );
  }

  return (
    <AptitudeQuestionScreen
      companyName={displayCompany}
      roleTitle={displayRole}
      companyLogoUrl={companyLogoUrl}
      category={selectedCategory}
      questions={activeCategoryQuestions}
      currentIndex={currentIndex}
      questionTimeLeft={questionTimeLeft}
      timeLeft={timeLeft}
      answers={answers}
      onSelectOption={handleSelectOption}
      onPrevious={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
      onNext={() => setCurrentIndex((prev) => Math.min(activeCategoryQuestions.length - 1, prev + 1))}
      onNavigate={setCurrentIndex}
      onSectionSubmit={handleCategorySubmit}
      showWarningModal={displayShowWarning}
      strikeCount={displayStrikeCount}
      maxStrikes={MAX_STRIKES}
      onResumeFullscreen={displayResumeFullscreen}
      onEliminate={handleEliminateCandidate}
    />
  );
}
