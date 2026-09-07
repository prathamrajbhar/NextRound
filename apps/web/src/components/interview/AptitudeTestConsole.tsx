'use client';

import React, { useEffect } from 'react';
import { useAptitudeSession } from './aptitude/useAptitudeSession';
import { AptitudeStateCard } from './aptitude/AptitudeStateCard';
import { AptitudeResultScreen } from './aptitude/AptitudeResultScreen';
import { AptitudeCategoryHub } from './aptitude/AptitudeCategoryHub';
import { AptitudeQuestionScreen } from './aptitude/AptitudeQuestionScreen';
import { AptitudeErrorScreen } from './aptitude/AptitudeErrorScreen';
import { RecordingBadge } from './RecordingBadge';
import type { AptitudeTestConsoleProps } from './aptitude/aptitude.types';

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
  recordingActive = false,
  recordingDurationMs = 0,
}: AptitudeTestConsoleProps) {
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
  const displayResumeFullscreen =
    onResumeFullscreen !== undefined ? onResumeFullscreen : localResumeFS;

  useEffect(() => {
    if (submitted && typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [submitted]);

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

  if (isLoading) {
    return (
      <AptitudeStateCard
        title="Loading Assessment Questions"
        subtitle={`Preparing category questions for ${displayRole}...`}
        spinningIcon
      />
    );
  }

  if (fetchError || activeQuestions.length === 0) {
    return <AptitudeErrorScreen error={fetchError} />;
  }

  if (!selectedCategory || !isStarted) {
    return (
      <>
        <RecordingBadge active={recordingActive} durationMs={recordingDurationMs} />
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
      </>
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
    <>
      <RecordingBadge active={recordingActive} durationMs={recordingDurationMs} />
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
    </>
  );
}
