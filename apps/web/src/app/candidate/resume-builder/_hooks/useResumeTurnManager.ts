'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ConversationTurn,
  createResumeSession,
  fetchResumeAiTurn,
} from './resumeVoiceApi';

interface UseResumeTurnManagerProps {
  targetRole: string;
  experienceLevel: string;
  initialSessionId?: string | null;
  existingResume?: string | null;
  careerGoals?: string | null;
  onSpeakText: (text: string, audioUrl?: string, callback?: () => void) => void;
  onStopSpeech: () => void;
  onStartSpeech: () => void;
  onFinalize: (sessionId: string, history: ConversationTurn[]) => void;
  setAiState: (state: 'speaking' | 'listening' | 'evaluating') => void;
  setError: (err: string | null) => void;
}

export function useResumeTurnManager({
  targetRole,
  experienceLevel,
  initialSessionId = null,
  existingResume = null,
  careerGoals = null,
  onSpeakText,
  onStopSpeech,
  onStartSpeech,
  onFinalize,
  setAiState,
  setError,
}: UseResumeTurnManagerProps) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [turnIndex, setTurnIndex] = useState(0);
  const [stage, setStage] = useState<string>('intro');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [realtimeInsight, setRealtimeInsight] = useState<string | null>(null);
  const [memory, setMemory] = useState<Record<string, unknown>>({});
  const [profileType, setProfileType] = useState<string | null>(null);

  const conversationHistoryRef = useRef<ConversationTurn[]>([]);
  const memoryRef = useRef<Record<string, unknown>>({});
  const profileTypeRef = useRef<string | null>(null);

  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  useEffect(() => {
    memoryRef.current = memory;
  }, [memory]);

  useEffect(() => {
    profileTypeRef.current = profileType;
  }, [profileType]);

  const getAIResponse = useCallback(
    async (
      candidateResponse: string,
      currentSessionId: string,
      currentTurnIndex: number,
      currentStage: string
    ) => {
      setAiState('evaluating');
      onStopSpeech();

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
        const data = await fetchResumeAiTurn({
          sessionId: currentSessionId,
          transcript: candidateResponse,
          targetRole,
          targetCompany: 'Target Enterprise',
          stage: currentStage,
          turnNumber: currentTurnIndex,
          conversationHistory: newHistory.map((h) => ({
            speaker: h.role,
            text: h.content,
          })),
          memory: memoryRef.current,
          existingResume,
          careerGoals,
          profileType: profileTypeRef.current,
        });

        if (data.memory) {
          setMemory(data.memory);
          // Track profile type as it gets inferred by the agent
          const inferredType = (data.memory as Record<string, unknown>).profile_type as string | null;
          if (inferredType && inferredType !== profileTypeRef.current) {
            setProfileType(inferredType);
          }
        }

        const updatedHistory = [
          ...newHistory,
          { role: 'ai' as const, content: data.text, timestamp: new Date().toLocaleTimeString() },
        ];
        setConversationHistory(updatedHistory);
        setTurnIndex(data.turnNumber);
        setStage(data.stage);
        if (data.realtimeInsight) setRealtimeInsight(data.realtimeInsight);

        if (data.isComplete) {
          setAiState('speaking');
          onSpeakText(data.text, data.audioUrl, () => {
            onFinalize(currentSessionId, updatedHistory);
          });
        } else {
          onSpeakText(data.text, data.audioUrl, () => {
            setAiState('listening');
            onStartSpeech();
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message || 'Error communicating with AI voice agent.');
        setAiState('listening');
      }
    },
    [targetRole, existingResume, careerGoals, onSpeakText, onStopSpeech, onStartSpeech, onFinalize, setAiState, setError]
  );

  const startCall = useCallback(async () => {
    setError(null);
    setConversationHistory([]);
    setTurnIndex(0);
    setStage('intro');
    setAiState('speaking');
    setMemory({});
    setProfileType(null);
    memoryRef.current = {};
    profileTypeRef.current = null;

    try {
      let activeSessionId = initialSessionId;
      if (!activeSessionId) {
        activeSessionId = await createResumeSession(targetRole, experienceLevel);
        setSessionId(activeSessionId);
      }
      await getAIResponse('', activeSessionId, 0, 'intro');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message || 'Failed to start resume builder session.');
    }
  }, [targetRole, experienceLevel, initialSessionId, getAIResponse, setAiState, setError]);

  const resetAll = useCallback(() => {
    setSessionId(null);
    setTurnIndex(0);
    setStage('intro');
    setConversationHistory([]);
    setRealtimeInsight(null);
    setError(null);
    setMemory({});
    setProfileType(null);
    conversationHistoryRef.current = [];
    memoryRef.current = {};
    profileTypeRef.current = null;
  }, [setError]);

  return {
    sessionId,
    turnIndex,
    stage,
    conversationHistory,
    conversationHistoryRef,
    realtimeInsight,
    memory,
    profileType,
    getAIResponse,
    startCall,
    resetAll,
  };
}
