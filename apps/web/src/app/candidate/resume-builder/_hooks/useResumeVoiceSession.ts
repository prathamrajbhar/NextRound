'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  playAudio,
  stopAudio,
  unlockAudio,
  replayLastAudio as replayAudioManager,
} from '@/lib/audioManager';
import { useResumeSpeech } from './useResumeSpeech';
import { useResumeTurnManager } from './useResumeTurnManager';
import { ConversationTurn, finalizeResumeSession } from './resumeVoiceApi';

export type { ConversationTurn };

interface UseResumeVoiceSessionProps {
  targetRole: string;
  experienceLevel: string;
  initialSessionId?: string | null;
  existingResume?: string | null;
  careerGoals?: string | null;
  onComplete: (sessionId: string, transcript: ConversationTurn[]) => void;
}

export function useResumeVoiceSession({
  targetRole,
  experienceLevel,
  initialSessionId = null,
  existingResume = null,
  careerGoals = null,
  onComplete,
}: UseResumeVoiceSessionProps) {
  const [aiState, setAiState] = useState<'speaking' | 'listening' | 'evaluating'>('speaking');
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const aiStateRef = useRef<'speaking' | 'listening' | 'evaluating'>('speaking');
  const submitResponseRef = useRef<((text: string) => Promise<void>) | null>(null);
  const finalizeExtrasRef = useRef<{
    memory: Record<string, unknown>;
    profileType: string | null;
  }>({ memory: {}, profileType: null });

  useEffect(() => {
    aiStateRef.current = aiState;
  }, [aiState]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const speech = useResumeSpeech({
    micActive,
    getAiState: () => aiStateRef.current,
    onFinalTranscript: (text) => submitResponseRef.current?.(text),
    onError: (msg) => setError(msg),
  });

  const speakText = useCallback(
    (text: string, audioUrl?: string, callback?: () => void) => {
      setAiState('speaking');
      speech.markSpeechStart();
      speech.startSpeechRecognition();

      playAudio(text, audioUrl, () => {
        setTimeout(() => {
          setAiState('listening');
          if (callback) callback();
          if (!speech.isRecognitionActive()) {
            speech.startSpeechRecognition();
          }
        }, 600);
      });
    },
    [speech]
  );

  const handleFinalize = useCallback(
    async (activeSessionId: string, finalHistory: ConversationTurn[]) => {
      speech.stopSpeechRecognition();
      await finalizeResumeSession(activeSessionId, finalHistory, {
        memory: finalizeExtrasRef.current.memory,
        profileType: finalizeExtrasRef.current.profileType,
        existingResume,
        careerGoals,
      });
      onComplete(activeSessionId, finalHistory);
    },
    [speech, existingResume, careerGoals, onComplete]
  );

  const turns = useResumeTurnManager({
    targetRole,
    experienceLevel,
    initialSessionId,
    existingResume,
    careerGoals,
    onSpeakText: speakText,
    onStopSpeech: speech.stopSpeechRecognition,
    onStartSpeech: speech.startSpeechRecognition,
    onFinalize: handleFinalize,
    setAiState,
    setError,
  });

  // Keep finalize extras ref in sync so handleFinalize always reads latest values
  useEffect(() => {
    finalizeExtrasRef.current = {
      memory: turns.memory,
      profileType: turns.profileType,
    };
  }, [turns.memory, turns.profileType]);

  const replayLastAudio = useCallback(() => {
    setAiState('speaking');
    replayAudioManager(() => {
      setAiState('listening');
    });
  }, []);

  const startCall = useCallback(async () => {
    unlockAudio();
    await turns.startCall();
  }, [turns]);

  const submitResponse = useCallback(
    async (text: string) => {
      if (aiState !== 'listening' || !turns.sessionId) return;
      speech.setCandidateSpeechText('');
      await turns.getAIResponse(text, turns.sessionId, turns.turnIndex, turns.stage);
    },
    [aiState, turns, speech]
  );

  useEffect(() => {
    submitResponseRef.current = submitResponse;
  }, [submitResponse]);

  const submitVoiceResponse = useCallback(() => {
    if (aiState !== 'listening' || !speech.candidateSpeechText.trim()) return;
    submitResponse(speech.candidateSpeechText);
  }, [aiState, speech.candidateSpeechText, submitResponse]);

  const endCall = useCallback(async () => {
    if (!turns.sessionId) return;
    stopAudio();
    await handleFinalize(turns.sessionId, turns.conversationHistoryRef.current);
  }, [turns.sessionId, turns.conversationHistoryRef, handleFinalize]);

  const handleToggleMic = useCallback(() => {
    setMicActive((prev) => {
      const next = !prev;
      if (!next) {
        speech.stopSpeechRecognition();
      } else if (aiState === 'listening') {
        setTimeout(speech.startSpeechRecognition, 100);
      }
      return next;
    });
  }, [aiState, speech]);

  const abortCall = useCallback(() => {
    stopAudio();
    speech.stopSpeechRecognition();
    setAiState('speaking');
    speech.setCandidateSpeechText('');
    turns.resetAll();
  }, [speech, turns]);

  return {
    sessionId: turns.sessionId,
    stage: turns.stage,
    turnIndex: turns.turnIndex,
    conversationHistory: turns.conversationHistory,
    aiState,
    candidateSpeechText: speech.candidateSpeechText,
    realtimeInsight: turns.realtimeInsight,
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
