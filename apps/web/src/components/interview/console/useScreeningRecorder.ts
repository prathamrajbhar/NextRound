'use client';

import { useState, useEffect } from 'react';
import { ScreeningQuestion } from './types';

interface UseScreeningRecorderOptions {
  screeningQuestions: ScreeningQuestion[];
  onSubmitScreening?: (recorded: Record<string, { duration: number; attempts: number }>) => void;
}

/**
 * Video-screening recording state machine: current question index, record
 * toggle, per-question timer, and per-question recorded durations/attempts.
 * Consumed by UnifiedInterviewConsole in `video-screening` mode.
 */
export function useScreeningRecorder({ screeningQuestions, onSubmitScreening }: UseScreeningRecorderOptions) {
  const [screeningIdx, setScreeningIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [recordedList, setRecordedList] = useState<Record<string, { duration: number; attempts: number }>>({});
  const [attempts, setAttempts] = useState(1);

  // Recording timer — only ever active while recording, which only happens in
  // video-screening mode (the record toggle is only reachable from that UI).
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordingTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      const qId = screeningQuestions[screeningIdx]?.questionId || `q-${screeningIdx}`;
      setRecordedList((prev) => ({
        ...prev,
        [qId]: { duration: recordingTimer || 30, attempts },
      }));
    } else {
      setIsRecording(true);
      setRecordingTimer(0);
    }
  };

  const nextQuestion = () => {
    if (screeningIdx < screeningQuestions.length - 1) {
      setScreeningIdx((prev) => prev + 1);
      setAttempts(1);
      setRecordingTimer(0);
      setIsRecording(false);
    } else if (onSubmitScreening) {
      onSubmitScreening(recordedList);
    }
  };

  return {
    screeningIdx,
    isRecording,
    recordingTimer,
    recordedList,
    attempts,
    toggleRecording,
    nextQuestion,
  };
}
