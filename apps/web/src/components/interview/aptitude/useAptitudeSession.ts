'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import {
  useAptitudeQuestions,
  normalizeCategory,
  STANDARD_CATEGORIES,
  type AptitudeQuestion,
} from './useAptitudeQuestions';

export const QUESTION_TIME_LIMIT = 60; // 60s per question
export const TOTAL_TIME_LIMIT = 900; // 15 min total

interface UseAptitudeSessionOptions {
  questions?: AptitudeQuestion[];
  applicationId?: string;
  sessionId?: string;
  role: string;
  company: string;
  onComplete: (score: number) => void;
  disableProctoring?: boolean;
}

/**
 * Aptitude assessment state machine. Owns question loading (via
 * useAptitudeQuestions), category section flow, per-question + overall
 * timers, proctoring strikes, and the final composite submit. The console
 * component consumes this hook and only renders the active screen.
 */
export function useAptitudeSession({
  questions = [],
  applicationId,
  sessionId,
  role,
  company,
  onComplete,
  disableProctoring = false,
}: UseAptitudeSessionOptions) {
  const { questions: fetchedQuestions, mcqDistribution, isLoading, isPrefetching, prefetchNextBatch, fetchError } = useAptitudeQuestions({
    applicationId,
    sessionId,
    role,
    company,
  });

  // Section/Category tracking states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [completedCategoryScores, setCompletedCategoryScores] = useState<Record<string, number>>({});
  const [isStarted, setIsStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_LIMIT);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const timeLeftRef = useRef(TOTAL_TIME_LIMIT);
  const questionTimeLeftRef = useRef(QUESTION_TIME_LIMIT);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [strikeCount, setStrikeCount] = useState(0);


  // Normalize & sort active questions sequentially by category
  const activeQuestions = useMemo(() => {
    const list = fetchedQuestions.length > 0 ? fetchedQuestions : questions;
    const mapped = list.map((q, idx) => ({
      ...q,
      category: normalizeCategory(q.category, idx),
    }));

    return mapped.sort((a, b) => {
      const idxA = (STANDARD_CATEGORIES as readonly string[]).indexOf(a.category);
      const idxB = (STANDARD_CATEGORIES as readonly string[]).indexOf(b.category);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }, [fetchedQuestions, questions]);

  // Available unique categories — always all 4 standard categories so the hub
  // shows every section upfront. Questions are loaded per-category on demand.
  const availableCategories = useMemo(() => {
    return [...STANDARD_CATEGORIES] as string[];
  }, []);

  // Get question count per category for display purposes
  // If we have actual questions loaded, use those counts
  // Otherwise estimate from standard distribution
  const getCategoryQuestionCount = useCallback((category: string): number => {
    if (mcqDistribution && typeof mcqDistribution[category] === 'number') {
      return mcqDistribution[category];
    }

    const actualQuestions = activeQuestions.filter(q => q.category === category);
    if (actualQuestions.length > 0) {
      return actualQuestions.length;
    }
    
    // Fallback: estimate from total if we don't have questions loaded yet
    // This ensures we show reasonable estimates before questions are loaded
    const totalQuestions = activeQuestions.length;
    if (totalQuestions === 0) {
      // Default to 5 per category if no data available
      return 5;
    }
    
    // Distribute evenly across categories
    const base = Math.floor(totalQuestions / 4);
    const remainder = totalQuestions % 4;
    const categoryIndex = (STANDARD_CATEGORIES as readonly string[]).indexOf(category);
    return base + (categoryIndex >= 0 && categoryIndex < remainder ? 1 : 0);
  }, [activeQuestions, mcqDistribution]);

  // Active questions for the currently selected category section
  const activeCategoryQuestions = useMemo(() => {
    if (!selectedCategory) return [];
    const filtered = activeQuestions.filter((q) => q.category === selectedCategory);
    if (mcqDistribution && typeof mcqDistribution[selectedCategory] === 'number') {
      return filtered.slice(0, mcqDistribution[selectedCategory]);
    }
    return filtered;
  }, [activeQuestions, selectedCategory, mcqDistribution]);

  // Prefetch the next batch as the candidate nears the end of the loaded set
  useEffect(() => {
    if (!applicationId && activeQuestions.length > 0 && currentIndex >= activeQuestions.length - 2 && !isPrefetching) {
      const timer = setTimeout(() => {
        prefetchNextBatch();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [applicationId, currentIndex, activeQuestions.length, isPrefetching, prefetchNextBatch]);

  // Final Overall Submission
  const handleFinalSubmit = useCallback(async () => {
    setIsSubmitting(true);
    let totalCorrect = 0;
    activeQuestions.forEach((q) => {
      if (q.correctIndex !== undefined && answers[q.id] === q.correctIndex) {
        totalCorrect++;
      }
    });
    let percentage = activeQuestions.length > 0 ? Math.round((totalCorrect / activeQuestions.length) * 100) : 0;

    if (applicationId) {
      try {
        const formattedAnswers = Object.entries(answers).map(([qId, sel]) => ({
          questionId: qId,
          selectedOption: sel,
        }));
        const res = await apiClient.post<{ score?: number }>(`/applications/${applicationId}/assessment/aptitude`, {
          answers: formattedAnswers,
          totalTimeSeconds: TOTAL_TIME_LIMIT - timeLeft,
          tabSwitchCount: strikeCount,
        });
        if (res && typeof res.score === 'number') {
          percentage = Math.max(0, Math.min(100, Math.round(res.score)));
        }
      } catch (err) {
        console.error('Failed to submit aptitude assessment:', err);
      }
    }

    setFinalScore(percentage);
    setSubmitted(true);
    setIsSubmitting(false);
  }, [answers, applicationId, activeQuestions, strikeCount, timeLeft]);

  // Submit current category section & return to Category Selection Hub
  const handleCategorySubmit = useCallback(async () => {
    if (!selectedCategory) return;

    let catCorrect = 0;
    activeCategoryQuestions.forEach((q) => {
      if (q.correctIndex !== undefined && answers[q.id] === q.correctIndex) {
        catCorrect++;
      }
    });

    const catScore = activeCategoryQuestions.length > 0
      ? Math.round((catCorrect / activeCategoryQuestions.length) * 100)
      : 100;

    setCompletedCategoryScores((prev) => {
      const nextScores = { ...prev, [selectedCategory]: catScore };
      // Auto-submit when all categories are done
      const allDone = availableCategories.every((cat) => nextScores[cat] !== undefined);
      if (allDone) setTimeout(() => handleFinalSubmit(), 100);
      return nextScores;
    });

    setSelectedCategory(null);
    setIsStarted(false);
  }, [selectedCategory, activeCategoryQuestions, answers, availableCategories, handleFinalSubmit]);

  // Anti-Cheat: only watch tab visibility (fullscreen is managed by the
  // external ProctoringClient when proctoring is active).
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

  // Reset per-question timer on question change
  useEffect(() => {
    if (!isStarted || !selectedCategory) return;
    const timer = setTimeout(() => {
      questionTimeLeftRef.current = QUESTION_TIME_LIMIT;
      setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    }, 0);
    return () => clearTimeout(timer);
  }, [currentIndex, isStarted, selectedCategory]);

  // 60-Second Per-Question Timer
  useEffect(() => {
    if (submitted || showWarningModal || !isStarted || !selectedCategory) return;

    const interval = setInterval(() => {
      if (questionTimeLeftRef.current <= 0) return;
      questionTimeLeftRef.current -= 1;
      setQuestionTimeLeft(questionTimeLeftRef.current);

      if (questionTimeLeftRef.current === 0) {
        if (currentIndex < activeCategoryQuestions.length - 1) {
          setCurrentIndex((idx) => idx + 1);
          questionTimeLeftRef.current = QUESTION_TIME_LIMIT;
          setQuestionTimeLeft(QUESTION_TIME_LIMIT);
        } else {
          handleCategorySubmit();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, showWarningModal, isStarted, selectedCategory, currentIndex, activeCategoryQuestions.length, handleCategorySubmit]);

  // Overall Countdown Timer
  useEffect(() => {
    if (submitted || showWarningModal || !isStarted) return;

    const interval = setInterval(() => {
      if (timeLeftRef.current <= 0) return;
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      if (timeLeftRef.current === 0) {
        handleFinalSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, showWarningModal, isStarted, handleFinalSubmit]);

  const handleSelectOption = (optIndex: number) => {
    const currentQ = activeCategoryQuestions[currentIndex];
    if (currentQ) {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: optIndex }));
    }
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
    setSubmitted(true);
    onComplete(0);
  };

  const handleStartCategorySection = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentIndex(0);
    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    questionTimeLeftRef.current = QUESTION_TIME_LIMIT;
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
    timeLeft,
    questionTimeLeft,
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
