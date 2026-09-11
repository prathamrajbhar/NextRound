'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  SpeechRecognitionClass,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionInstance,
} from './speechRecognition.types';
import { stopAudio } from '@/lib/audioManager';

interface UseResumeSpeechProps {
  micActive: boolean;
  getAiState: () => 'speaking' | 'listening' | 'evaluating';
  onFinalTranscript: (text: string) => void;
  onError: (msg: string) => void;
}

export function useResumeSpeech({
  micActive,
  getAiState,
  onFinalTranscript,
  onError,
}: UseResumeSpeechProps) {
  const [candidateSpeechText, setCandidateSpeechText] = useState('');
  const candidateSpeechTextRef = useRef('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const recognitionActiveRef = useRef(false);
  const speechStartRef = useRef(0);

  useEffect(() => {
    candidateSpeechTextRef.current = candidateSpeechText;
  }, [candidateSpeechText]);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.abort();
        } catch {}
      }
    };
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    recognitionActiveRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const startSpeechRecognition = useCallback(() => {
    if (!SpeechRecognitionClass || !micActive) return;
    if (recognitionActiveRef.current) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;
    recognitionActiveRef.current = true;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setCandidateSpeechText('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
      const displayTranscript = finalTranscript || interimTranscript;
      if (displayTranscript) {
        setCandidateSpeechText(displayTranscript);
      }

      if (getAiState() === 'speaking') {
        const elapsed = Date.now() - (speechStartRef.current || 0);
        const isSubstantial = (finalTranscript || interimTranscript).trim().length >= 5;
        if (elapsed > 900 && isSubstantial) {
          stopAudio();
        }
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
        onError('Microphone permission denied. Please allow access or type your response.');
      }
    };

    recognition.onend = () => {
      recognitionActiveRef.current = false;
      if (getAiState() === 'listening') {
        const spokenText = candidateSpeechTextRef.current;
        if (spokenText && spokenText.trim().length > 1) {
          onFinalTranscript(spokenText);
        } else {
          try {
            recognitionRef.current?.start();
            recognitionActiveRef.current = true;
          } catch {}
        }
      }
    };

    try {
      recognition.start();
    } catch {
      recognitionActiveRef.current = false;
    }
  }, [micActive, getAiState, onFinalTranscript, onError]);

  const markSpeechStart = useCallback(() => {
    speechStartRef.current = Date.now();
  }, []);

  return {
    candidateSpeechText,
    setCandidateSpeechText,
    startSpeechRecognition,
    stopSpeechRecognition,
    markSpeechStart,
    isRecognitionActive: () => recognitionActiveRef.current,
  };
}
