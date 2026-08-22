'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { siteConfig } from '@/lib/config';
import { playAudio, stopAudio, unlockAudio, replayLastAudio as replayAudioManager } from '@/lib/audioManager';

export interface ConversationTurn {
  role: 'ai' | 'candidate';
  content: string;
  timestamp: string;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [key: number]: {
      isFinal: boolean;
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const SpeechRecognitionClass =
  typeof window !== 'undefined'
    ? ((window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
       (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition)
    : null;

interface UseResumeVoiceSessionProps {
  targetRole: string;
  experienceLevel: string;
  initialSessionId?: string | null;
  onComplete: (sessionId: string, transcript: ConversationTurn[]) => void;
}

export function useResumeVoiceSession({
  targetRole,
  experienceLevel,
  initialSessionId = null,
  onComplete,
}: UseResumeVoiceSessionProps) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [turnIndex, setTurnIndex] = useState(0);
  const [stage, setStage] = useState<string>('intro');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [aiState, setAiState] = useState<'speaking' | 'listening' | 'evaluating'>('speaking');
  const [candidateSpeechText, setCandidateSpeechText] = useState('');
  const [realtimeInsight, setRealtimeInsight] = useState<string | null>(null);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memory, setMemory] = useState<Record<string, unknown>>({});

  const conversationHistoryRef = useRef<ConversationTurn[]>([]);
  const turnIndexRef = useRef(0);
  const stageRef = useRef('intro');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const memoryRef = useRef<Record<string, unknown>>({});
  const speechStartRef = useRef(0);
  const recognitionActiveRef = useRef(false);

  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  useEffect(() => {
    turnIndexRef.current = turnIndex;
  }, [turnIndex]);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    memoryRef.current = memory;
  }, [memory]);

  const candidateSpeechTextRef = useRef('');
  const aiStateRef = useRef<'speaking' | 'listening' | 'evaluating'>('speaking');

  useEffect(() => {
    candidateSpeechTextRef.current = candidateSpeechText;
  }, [candidateSpeechText]);

  useEffect(() => {
    aiStateRef.current = aiState;
  }, [aiState]);

  const submitResponseRef = useRef<((text: string) => Promise<void>) | null>(null);

  useEffect(() => {
    return () => {
      stopAudio();
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.abort();
        } catch {}
      }
    };
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

      if (aiStateRef.current === 'speaking') {
        const elapsed = Date.now() - (speechStartRef.current || 0);
        const isSubstantial = (finalTranscript || interimTranscript).trim().length >= 5;
        if (elapsed > 900 && isSubstantial) {
          stopAudio();
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {

      if (event.error === 'aborted' || event.error === 'no-speech' || event.error === 'network') {
        return;
      }
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow access or type your response.');
      } else {
        console.warn('SpeechRecognition error:', event.error);
      }
    };

    recognition.onend = () => {
      recognitionActiveRef.current = false;

      if (aiStateRef.current === 'listening') {
        const spokenText = candidateSpeechTextRef.current;
        if (spokenText && spokenText.trim().length > 1) {
          submitResponseRef.current?.(spokenText);
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
    } catch (e) {
      recognitionActiveRef.current = false;
      console.error('Failed to start SpeechRecognition:', e);
    }
  }, [micActive]);

  const speakText = useCallback((text: string, audioUrl?: string, callback?: () => void) => {
    setAiState('speaking');
    speechStartRef.current = Date.now();

    startSpeechRecognition();
    playAudio(text, audioUrl, () => {

      setTimeout(() => {
        setAiState('listening');
        if (callback) callback();
        if (!recognitionActiveRef.current) {
          startSpeechRecognition();
        }
      }, 600);
    });
  }, [startSpeechRecognition]);

  const replayLastAudio = useCallback(() => {
    setAiState('speaking');
    replayAudioManager(() => {
      setAiState('listening');
    });
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

  const handleFinalize = useCallback(
    async (activeSessionId: string, finalHistory: ConversationTurn[]) => {
      stopSpeechRecognition();
      try {
        await apiClient.post(`/resume-builder/${activeSessionId}/end`, {
          transcript: finalHistory.map((h) => ({
            speaker: h.role,
            text: h.content,
          })),
        });
      } catch (err) {
        console.warn('Backend end-session call warning (proceeding to resume stage):', err);
      } finally {
        onComplete(activeSessionId, finalHistory);
      }
    },
    [stopSpeechRecognition, onComplete]
  );

  const getAIResponse = useCallback(
    async (
      candidateResponse: string,
      currentSessionId: string,
      currentTurnIndex: number,
      currentStage: string
    ) => {
      setAiState('evaluating');
      stopSpeechRecognition();

      const newHistory = [...conversationHistoryRef.current];
      if (candidateResponse.trim()) {
        newHistory.push({
          role: 'candidate',
          content: candidateResponse,
          timestamp: new Date().toLocaleTimeString(),
        });
        setConversationHistory(newHistory);
      }

      try {
        const res = await fetch(`${siteConfig.aiServiceUrl}/api/v1/ai/resume-builder/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSessionId,
            transcript: candidateResponse,
            targetRole,
            targetCompany: 'Target Enterprise',
            experienceLevel,
            stage: currentStage,
            turnNumber: currentTurnIndex,
            conversationHistory: newHistory.map((h) => ({
              speaker: h.role,
              text: h.content,
            })),
            memory: memoryRef.current,
          }),
        });

        if (!res.ok) {
          throw new Error(`AI Service error: ${res.statusText}`);
        }

        const data = (await res.json()) as {
          text: string;
          stage: string;
          turnNumber: number;
          isComplete: boolean;
          realtimeInsight?: string;
          memory?: Record<string, unknown>;
          audioUrl?: string;
        };

        if (data.memory) {
          setMemory(data.memory);
        }

        const updatedHistory = [
          ...newHistory,
          {
            role: 'ai' as const,
            content: data.text,
            timestamp: new Date().toLocaleTimeString(),
          },
        ];
        setConversationHistory(updatedHistory);
        setTurnIndex(data.turnNumber);
        setStage(data.stage);
        if (data.realtimeInsight) {
          setRealtimeInsight(data.realtimeInsight);
        }

        if (data.isComplete) {
          setAiState('speaking');
          speakText(data.text, data.audioUrl, () => {
            handleFinalize(currentSessionId, updatedHistory);
          });
        } else {
          speakText(data.text, data.audioUrl, () => {
            setAiState('listening');
            startSpeechRecognition();
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to get AI respond turn:', err);
        setError(message || 'Error communicating with AI voice agent.');
        setAiState('listening');
      }
    },
    [targetRole, experienceLevel, speakText, startSpeechRecognition, stopSpeechRecognition, handleFinalize]
  );

  const startCall = useCallback(async () => {
    unlockAudio();
    setError(null);
    setConversationHistory([]);
    setTurnIndex(0);
    setStage('intro');
    setAiState('speaking');
    setMemory({});
    memoryRef.current = {};

    try {
      let activeSessionId = initialSessionId;

      if (!activeSessionId) {
        const sessionRes = await apiClient.post<{ sessionId: string }>('/resume-builder/sessions', {
          targetRole,
          experienceLevel,
        });

        if (!sessionRes?.sessionId) {
          throw new Error('Failed to obtain session ID from backend.');
        }

        activeSessionId = sessionRes.sessionId;
        setSessionId(activeSessionId);
      }

      await getAIResponse('', activeSessionId, 0, 'intro');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Start call failed:', err);
      setError(message || 'Failed to start resume builder session.');
    }
  }, [targetRole, experienceLevel, initialSessionId, getAIResponse]);

  const submitResponse = useCallback(
    async (text: string) => {
      if (aiState !== 'listening' || !sessionId) return;
      setCandidateSpeechText('');
      await getAIResponse(text, sessionId, turnIndex, stage);
    },
    [aiState, sessionId, turnIndex, stage, getAIResponse]
  );

  useEffect(() => {
    submitResponseRef.current = submitResponse;
  }, [submitResponse]);

  const submitVoiceResponse = useCallback(() => {
    if (aiState !== 'listening' || !candidateSpeechText.trim()) return;
    submitResponse(candidateSpeechText);
  }, [aiState, candidateSpeechText, submitResponse]);

  const endCall = useCallback(async () => {
    if (!sessionId) return;
    stopAudio();
    await handleFinalize(sessionId, conversationHistoryRef.current);
  }, [sessionId, handleFinalize]);

  const handleToggleMic = useCallback(() => {
    setMicActive((prev) => {
      const next = !prev;
      if (!next) {
        stopSpeechRecognition();
      } else if (aiState === 'listening') {
        setTimeout(startSpeechRecognition, 100);
      }
      return next;
    });
  }, [aiState, stopSpeechRecognition, startSpeechRecognition]);

  const abortCall = useCallback(() => {
    stopAudio();
    stopSpeechRecognition();
    setSessionId(null);
    setTurnIndex(0);
    setStage('intro');
    setConversationHistory([]);
    setAiState('speaking');
    setCandidateSpeechText('');
    setRealtimeInsight(null);
    setError(null);
    setMemory({});
    conversationHistoryRef.current = [];
    turnIndexRef.current = 0;
    stageRef.current = 'intro';
    memoryRef.current = {};
  }, [stopSpeechRecognition]);

  return {
    sessionId,
    stage,
    turnIndex,
    conversationHistory,
    aiState,
    candidateSpeechText,
    realtimeInsight,
    micActive,
    camActive,
    setCamActive,
    toggleMic: handleToggleMic,
    error,
    startCall,
    submitResponse,
    submitVoiceResponse,
    replayLastAudio,
    endCall,
    abortCall,
  };
}
