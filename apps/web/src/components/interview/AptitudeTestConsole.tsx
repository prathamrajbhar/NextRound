'use client';

import React from 'react';
import { useAptitudeSession } from './aptitude/useAptitudeSession';
import { AptitudeStateCard } from './aptitude/AptitudeStateCard';
import { AptitudeResultScreen } from './aptitude/AptitudeResultScreen';
import { AptitudeCategoryHub } from './aptitude/AptitudeCategoryHub';
import { AptitudeQuestionScreen } from './aptitude/AptitudeQuestionScreen';
import type { AptitudeQuestion } from './aptitude/useAptitudeQuestions';

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
}

const MAX_STRIKES = 3;

/**
 * Aptitude assessment presenter. All state-machine logic (question loading,
 * category flow, timers, proctoring strikes, submit) lives in
 * useAptitudeSession; this component only renders the active screen.
 */
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
  });

  const {
    isLoading,
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
    showWarningModal,
    strikeCount,
    handleFinalSubmit,
    handleCategorySubmit,
    handleSelectOption,
    handleResumeFullscreen,
    handleEliminateCandidate,
    handleStartCategorySection,
  } = session;

  // SUBMITTED STATE
  if (submitted) {
    const isEliminated = strikeCount >= MAX_STRIKES;
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

  // CATEGORY SELECTION HUB SCREEN (Returned to after completing a category section)
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
      showWarningModal={showWarningModal}
      strikeCount={strikeCount}
      maxStrikes={MAX_STRIKES}
      onResumeFullscreen={handleResumeFullscreen}
      onEliminate={handleEliminateCandidate}
    />
  );
}
