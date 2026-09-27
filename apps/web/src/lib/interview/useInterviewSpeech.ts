'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  SpeechRecognitionClass,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionInstance,
} from '@/app/candidate/resume-builder/_hooks/speechRecognition.types';
import { stopAudio } from '@/lib/audioManager';

interface UseInterviewSpeechProps {
  micActive: boolean;
  isAiSpeaking: boolean;
  isAnalyzing: boolean;
  onFinalTranscript: (text: string) => void;
  onError?: (msg: string) => void;
}

export function useInterviewSpeech({
  micActive,
  isAiSpeaking,
  isAnalyzing,
  onFinalTranscript,
  onError,
}: UseInterviewSpeechProps) {
  const [candidateSpeechText, setCandidateSpeechText] = useState('');
  const candidateSpeechTextRef = useRef('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const recognitionActiveRef = useRef(false);
  const speechStartRef = useRef(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isAiSpeakingRef = useRef(isAiSpeaking);
  const isAnalyzingRef = useRef(isAnalyzing);
  const micActiveRef = useRef(micActive);

  useEffect(() => {
    candidateSpeechTextRef.current = candidateSpeechText;
  }, [candidateSpeechText]);

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  useEffect(() => {
    isAnalyzingRef.current = isAnalyzing;
  }, [isAnalyzing]);

  useEffect(() => {
    micActiveRef.current = micActive;
  }, [micActive]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    clearSilenceTimer();
    recognitionActiveRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  }, [clearSilenceTimer]);

  const startSpeechRecognition = useCallback(() => {
    if (!SpeechRecognitionClass || !micActiveRef.current) return;
    if (recognitionActiveRef.current) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;
      recognitionActiveRef.current = true;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        speechStartRef.current = Date.now();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        clearSilenceTimer();

        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        const displayTranscript = (finalTranscript || interimTranscript).trim();
        if (displayTranscript) {
          setCandidateSpeechText(displayTranscript);
        }

        // If AI is currently speaking and user starts talking clearly, interrupt AI playback
        if (isAiSpeakingRef.current) {
          const elapsed = Date.now() - (speechStartRef.current || 0);
          const isSubstantial = displayTranscript.length >= 4;
          if (elapsed > 600 && isSubstantial) {
            stopAudio();
          }
        }

        // Auto-submit on natural pause/silence when candidate finished speaking
        if (!isAiSpeakingRef.current && !isAnalyzingRef.current && displayTranscript.length >= 2) {
          silenceTimerRef.current = setTimeout(() => {
            const spoken = candidateSpeechTextRef.current.trim();
            if (spoken.length >= 2 && !isAnalyzingRef.current && !isAiSpeakingRef.current) {
              setCandidateSpeechText('');
              candidateSpeechTextRef.current = '';
              onFinalTranscript(spoken);
            }
          }, 2500);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (
          event.error === 'aborted' ||
          event.error === 'no-speech' ||
          event.error === 'network'
        ) {
          return;
        }
        if (event.error === 'not-allowed') {
          onError?.('Microphone permission denied. Please allow mic access or type your response.');
        }
      };

      recognition.onend = () => {
        recognitionActiveRef.current = false;
        // If mic is still active and session is not analyzing, restart recognition
        if (micActiveRef.current && !isAnalyzingRef.current) {
          try {
            recognitionRef.current?.start();
            recognitionActiveRef.current = true;
          } catch {}
        }
      };

      recognition.start();
    } catch {
      recognitionActiveRef.current = false;
    }
  }, [clearSilenceTimer, onFinalTranscript, onError]);

  useEffect(() => {
    if (!micActive || isAnalyzing) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }

    return () => {
      stopSpeechRecognition();
    };
  }, [micActive, isAnalyzing, isAiSpeaking, startSpeechRecognition, stopSpeechRecognition]);

  return {
    candidateSpeechText,
    setCandidateSpeechText,
    startSpeechRecognition,
    stopSpeechRecognition,
    isRecognitionActive: () => recognitionActiveRef.current,
  };
}
