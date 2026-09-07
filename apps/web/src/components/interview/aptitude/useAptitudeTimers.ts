import { useState, useRef, useEffect } from 'react';

export const QUESTION_TIME_LIMIT = 60;
export const TOTAL_TIME_LIMIT = 900;

interface UseAptitudeTimersOptions {
  isStarted: boolean;
  selectedCategory: string | null;
  submitted: boolean;
  showWarningModal: boolean;
  currentIndex: number;
  totalQuestionsInCategory: number;
  onQuestionTimeout: () => void;
  onTotalTimeout: () => void;
}

export function useAptitudeTimers({
  isStarted,
  selectedCategory,
  submitted,
  showWarningModal,
  currentIndex,
  totalQuestionsInCategory,
  onQuestionTimeout,
  onTotalTimeout,
}: UseAptitudeTimersOptions) {
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_LIMIT);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const timeLeftRef = useRef(TOTAL_TIME_LIMIT);
  const questionTimeLeftRef = useRef(QUESTION_TIME_LIMIT);

  const resetQuestionTimer = () => {
    questionTimeLeftRef.current = QUESTION_TIME_LIMIT;
    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
  };

  useEffect(() => {
    if (!isStarted || !selectedCategory) return;
    resetQuestionTimer();
  }, [currentIndex, isStarted, selectedCategory]);

  useEffect(() => {
    if (submitted || showWarningModal || !isStarted || !selectedCategory) return;

    const interval = setInterval(() => {
      if (questionTimeLeftRef.current <= 0) return;
      questionTimeLeftRef.current -= 1;
      setQuestionTimeLeft(questionTimeLeftRef.current);

      if (questionTimeLeftRef.current === 0) {
        onQuestionTimeout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, showWarningModal, isStarted, selectedCategory, currentIndex, totalQuestionsInCategory, onQuestionTimeout]);

  useEffect(() => {
    if (submitted || showWarningModal || !isStarted) return;

    const interval = setInterval(() => {
      if (timeLeftRef.current <= 0) return;
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      if (timeLeftRef.current === 0) {
        onTotalTimeout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, showWarningModal, isStarted, onTotalTimeout]);

  return {
    timeLeft,
    questionTimeLeft,
    resetQuestionTimer,
  };
}
