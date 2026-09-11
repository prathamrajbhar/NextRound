'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  useAptitudeQuestions,
  normalizeCategory,
  STANDARD_CATEGORIES,
  type AptitudeQuestion,
} from './useAptitudeQuestions';
import { resolveCategoryQuestionCount } from './scoring';
import {
  submitAptitudeAssessment,
  computeCategoryScore,
  prepareActiveQuestions,
} from './aptitudeSessionApi';
import {
  useAptitudeTimers,
  QUESTION_TIME_LIMIT,
  TOTAL_TIME_LIMIT,
} from './useAptitudeTimers';
import type { UseAptitudeSessionOptions } from './aptitude.types';

export { QUESTION_TIME_LIMIT, TOTAL_TIME_LIMIT };

export function useAptitudeSession({
  questions = [],
  applicationId,
  sessionId,
  role,
  company,
  onComplete,
  disableProctoring = false,
}: UseAptitudeSessionOptions) {
  const { questions: fetchedQuestions, mcqDistribution, isLoading, fetchError } = useAptitudeQuestions({
    applicationId,
    sessionId,
    role,
    company,
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [completedCategoryScores, setCompletedCategoryScores] = useState<Record<string, number>>({});
  const [isStarted, setIsStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [strikeCount, setStrikeCount] = useState(0);

  const activeQuestions = useMemo(
    () => prepareActiveQuestions(fetchedQuestions, questions, normalizeCategory, STANDARD_CATEGORIES),
    [fetchedQuestions, questions]
  );

  const availableCategories = useMemo(() => {
    return [...STANDARD_CATEGORIES] as string[];
  }, []);

  const getCategoryQuestionCount = useCallback(
    (category: string): number => {
      return resolveCategoryQuestionCount(mcqDistribution, activeQuestions, category);
    },
    [activeQuestions, mcqDistribution]
  );

  const activeCategoryQuestions = useMemo(() => {
    if (!selectedCategory) return [];
    const filtered = activeQuestions.filter((q) => q.category === selectedCategory);
    if (mcqDistribution && typeof mcqDistribution[selectedCategory] === 'number') {
      return filtered.slice(0, mcqDistribution[selectedCategory]);
    }
    return filtered;
  }, [activeQuestions, selectedCategory, mcqDistribution]);

  const handleFinalSubmit = useCallback(async () => {
    setIsSubmitting(true);
    const percentage = await submitAptitudeAssessment({
      applicationId,
      answers,
      activeQuestions,
      timeLeft: timers.timeLeft,
      totalTimeLimit: TOTAL_TIME_LIMIT,
      strikeCount,
    });

    setFinalScore(percentage);
    setSubmitted(true);
    setIsSubmitting(false);
  }, [answers, applicationId, activeQuestions, strikeCount]);

  const handleCategorySubmit = useCallback(async () => {
    if (!selectedCategory) return;
    const catScore = computeCategoryScore(activeCategoryQuestions, answers);

    setCompletedCategoryScores((prev) => {
      const nextScores = { ...prev, [selectedCategory]: catScore };
      const allDone = availableCategories.every((cat) => nextScores[cat] !== undefined);
      if (allDone) setTimeout(() => handleFinalSubmit(), 100);
      return nextScores;
    });

    setSelectedCategory(null);
    setIsStarted(false);
  }, [selectedCategory, activeCategoryQuestions, answers, availableCategories, handleFinalSubmit]);

  const onQuestionTimeout = useCallback(() => {
    if (currentIndex < activeCategoryQuestions.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      timers.resetQuestionTimer();
    } else {
      handleCategorySubmit();
    }
  }, [currentIndex, activeCategoryQuestions.length, handleCategorySubmit]);

  const timers = useAptitudeTimers({
    isStarted,
    selectedCategory,
    submitted,
    showWarningModal,
    currentIndex,
    totalQuestionsInCategory: activeCategoryQuestions.length,
    onQuestionTimeout,
    onTotalTimeout: handleFinalSubmit,
  });

  useEffect(() => {
    if (disableProctoring || submitted || !isStarted || !selectedCategory) return;

    const handleVisibilityViolation = () => {
      if (document.hidden) {
        setStrikeCount((prev) => {
          setShowWarningModal(true);
          return prev + 1;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityViolation);
    return () => document.removeEventListener('visibilitychange', handleVisibilityViolation);
  }, [disableProctoring, submitted, isStarted, selectedCategory]);

  const handleSelectOption = (optIndex: number) => {
    const currentQ = activeCategoryQuestions[currentIndex];
    if (currentQ) {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: optIndex }));
    }
  };

  const handleResumeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setShowWarningModal(false);
  };

  const handleEliminateCandidate = () => {
    setSubmitted(true);
    onComplete(0);
  };

  const handleStartCategorySection = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentIndex(0);
    timers.resetQuestionTimer();
    setIsStarted(true);
  };

  return {
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
    timeLeft: timers.timeLeft,
    questionTimeLeft: timers.questionTimeLeft,
    submitted,
    isSubmitting,
    finalScore,
    showWarningModal,
    strikeCount,
    getCategoryQuestionCount,
    handleFinalSubmit,
    handleCategorySubmit,
    handleSelectOption,
    handleResumeFullscreen,
    handleEliminateCandidate,
    handleStartCategorySection,
  };
}
