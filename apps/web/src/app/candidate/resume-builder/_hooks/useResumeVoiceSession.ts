'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { siteConfig } from '@/lib/config';

export interface ConversationTurn {
  role: 'ai' | 'candidate';
  content: string;
  timestamp: string;
}

// Define explicit interfaces for Web Speech API to satisfy TypeScript's strict rules
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
function dataUriToBlobUrl(dataUri: string): string {
  try {
    if (!dataUri.startsWith('data:')) return dataUri;
    const [header, base64Data] = dataUri.split(',');
    if (!base64Data) return dataUri;
    const mimeMatch = header.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'audio/mp3';
    const binary = atob(base64Data);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Failed to convert data URI to blob URL:', err);
    return dataUri;
  }
}

interface UseResumeVoiceSessionProps {
  targetRole: string;
  experienceLevel: string;
  onComplete: (sessionId: string, transcript: ConversationTurn[]) => void;
}

export function useResumeVoiceSession({
  targetRole,
  experienceLevel,
  onComplete,
}: UseResumeVoiceSessionProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turnIndex, setTurnIndex] = useState(0);
  const [stage, setStage] = useState<string>('intro');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [aiState, setAiState] = useState<'speaking' | 'listening' | 'evaluating'>('speaking');
  const [candidateSpeechText, setCandidateSpeechText] = useState('');
  const [realtimeInsight, setRealtimeInsight] = useState<string | null>(null);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for tracking mutable states in async callbacks
  const conversationHistoryRef = useRef<ConversationTurn[]>([]);
  const turnIndexRef = useRef(0);
  const stageRef = useRef('intro');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAudioUrlRef = useRef<string | null>(null);
  const lastTextRef = useRef<string>('');

  // Keep refs in sync
  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  useEffect(() => {
    turnIndexRef.current = turnIndex;
  }, [turnIndex]);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  // Unlock web audio on user interaction
  const unlockAudio = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctx.resume().then(() => ctx.close()).catch(() => {});
      }
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch {
      // ignore
    }
  }, []);

  // Clean up speech synthesis & recognition & audio on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Text-To-Speech function with neural audio support
  const speakText = useCallback((text: string, audioUrl?: string, callback?: () => void) => {
    lastTextRef.current = text;
    if (audioUrl) {
      lastAudioUrlRef.current = audioUrl;
    }

    // Cancel any active audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setAiState('speaking');

    // 1. If neural audio URL is provided, play it
    if (audioUrl) {
      try {
        const playableUrl = dataUriToBlobUrl(audioUrl);
        const audio = new Audio(playableUrl);
        audioRef.current = audio;
        audio.volume = 1.0;

        audio.onended = () => {
          audioRef.current = null;
          setAiState('listening');
          if (callback) callback();
        };

        audio.onerror = (e) => {
          console.warn('Neural audio playback failed, falling back to speech synthesis:', e);
          fallbackSynthesis(text, callback);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Autoplay prevented neural audio, falling back to speech synthesis:', err);
            fallbackSynthesis(text, callback);
          });
        }
        return;
      } catch (err) {
        console.warn('Audio construction failed, falling back:', err);
      }
    }

    // 2. Fallback to Web Speech API
    fallbackSynthesis(text, callback);
  }, []);

  const fallbackSynthesis = (text: string, callback?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setAiState('listening');
      if (callback) callback();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft'))
      );
      if (targetVoice) utterance.voice = targetVoice;
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setAiState('listening');
        if (callback) callback();
      };

      utterance.onerror = (_e) => {
        console.warn('SpeechSynthesis error:', _e);
        setAiState('listening');
        if (callback) callback();
      };

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      setAiState('listening');
      if (callback) callback();
    }
  };

  const replayLastAudio = useCallback(() => {
    if (lastTextRef.current) {
      speakText(lastTextRef.current, lastAudioUrlRef.current || undefined);
    }
  }, [speakText]);

  // Speech-To-Text Stop function
  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  // Speech-To-Text Recognition configuration
  const startSpeechRecognition = useCallback(() => {
    if (!SpeechRecognitionClass || !micActive) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setAiState('listening');
      setCandidateSpeechText('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setCandidateSpeechText(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('SpeechRecognition error:', event.error);
    };

    recognition.onend = () => {
      // End callback
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start SpeechRecognition:', e);
    }
  }, [micActive]);

  // Finalize call
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
        onComplete(activeSessionId, finalHistory);
      } catch (err) {
        console.error('Failed to end session:', err);
        onComplete(activeSessionId, finalHistory);
      }
    },
    [stopSpeechRecognition, onComplete]
  );

  // Fetch AI Response Turn from FastAPI Service
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
            stage: currentStage,
            turnNumber: currentTurnIndex,
            conversationHistory: newHistory.map((h) => ({
              speaker: h.role,
              text: h.content,
            })),
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
          audioUrl?: string;
        };
        
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
    [targetRole, speakText, startSpeechRecognition, stopSpeechRecognition, handleFinalize]
  );

  // Initialize call
  const startCall = useCallback(async () => {
    unlockAudio();
    setError(null);
    setConversationHistory([]);
    setTurnIndex(0);
    setStage('intro');
    setAiState('speaking');

    try {
      const sessionRes = await apiClient.post<{ sessionId: string }>('/resume-builder/sessions', {
        targetRole,
        experienceLevel,
      });

      if (!sessionRes?.sessionId) {
        throw new Error('Failed to obtain session ID from backend.');
      }

      const activeSessionId = sessionRes.sessionId;
      setSessionId(activeSessionId);

      await getAIResponse('', activeSessionId, 0, 'intro');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Start call failed:', err);
      setError(message || 'Failed to start resume builder session.');
    }
  }, [targetRole, experienceLevel, getAIResponse]);

  // Submit response (spoken or typed)
  const submitResponse = useCallback(
    async (text: string) => {
      if (aiState !== 'listening' || !sessionId) return;
      setCandidateSpeechText('');
      await getAIResponse(text, sessionId, turnIndex, stage);
    },
    [aiState, sessionId, turnIndex, stage, getAIResponse]
  );

  // Submit voice response directly
  const submitVoiceResponse = useCallback(() => {
    if (aiState !== 'listening' || !candidateSpeechText.trim()) return;
    submitResponse(candidateSpeechText);
  }, [aiState, candidateSpeechText, submitResponse]);

  // End call early (manual click)
  const endCall = useCallback(async () => {
    if (!sessionId) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    window.speechSynthesis?.cancel();
    await handleFinalize(sessionId, conversationHistoryRef.current);
  }, [sessionId, handleFinalize]);

  // Toggle Mic status
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
  };
}
