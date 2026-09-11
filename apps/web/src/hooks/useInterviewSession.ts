'use client';

import { useState, useEffect, useRef } from 'react';
import type { Message, InterviewPhase } from '@/components/interview/console/types';
import {
  fetchInterviewContext,
  requestAiTurn,
  requestInitialAiTurn,
  endInterviewSession,
  InterviewContextData,
} from '@/lib/interview/interviewSessionApi';
import {
  createEliminationResult,
  evaluateCompletedInterview,
  getTurnStage,
  deriveNextInterviewPhase,
} from '@/lib/interview/interviewSessionEval';

import {
  UseInterviewSessionProps,
  ProctorTelemetryState,
} from '@/lib/interview/interviewSession.types';

export type { Message, InterviewPhase };

export function useInterviewSession({
  role,
  interviewId,
  onComplete,
}: UseInterviewSessionProps) {
  const [stage, setStage] = useState<'check' | 'session'>('check');
  const [phase, setPhase] = useState<InterviewPhase>('Introduction');
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(900);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRespondError, setAiRespondError] = useState<string | null>(null);
  const [proctorTelemetry, setProctorTelemetry] = useState<ProctorTelemetryState>({
    faceCount: null,
    gazeCentered: null,
    engagementIndex: null,
  });
  const [showWarningModal, setShowWarningModal] = useState(false);

  const transcriptData = useRef<{ question: string; answer: string; feedback: string }[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const lastAiQuestion = useRef('');
  const contextDataRef = useRef<InterviewContextData>({ jobTitle: role });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (stage !== 'session') return;
    if (showWarningModal) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, showWarningModal]);

  const startSession = async () => {
    setStage('session');
    setPhase('Introduction');
    setIsAnalyzing(true);

    const fsPromise = !document.fullscreenElement
      ? document.documentElement.requestFullscreen().catch(() => undefined)
      : Promise.resolve();

    contextDataRef.current = await fetchInterviewContext(interviewId, role);
    await fsPromise;

    try {
      const response = await requestInitialAiTurn(interviewId, contextDataRef.current);
      lastAiQuestion.current = response.text;
      setMessages([
        {
          id: 'ai-init',
          role: 'ai',
          content: response.text,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      setAiRespondError(err instanceof Error ? err.message : 'Network error contacting AI service.');
      setMessages([
        {
          id: 'ai-init-error',
          role: 'ai',
          content: 'I could not reach the AI voice engine to start the session. Please check your connection and try again.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitAnswer = async (text: string) => {
    if (!text.trim() || isAnalyzing) return;

    const currentTimestamp = Date.now();
    const timestamp = new Date(currentTimestamp).toLocaleTimeString();
    setMessages((prev) => [...prev, { id: `c-${currentTimestamp}`, role: 'candidate', content: text, timestamp }]);
    setIsAnalyzing(true);
    setAiRespondError(null);

    try {
      const turnStage = getTurnStage(phase);
      const response = await requestAiTurn({
        interviewId,
        transcript: text,
        turnNumber: messagesRef.current.length + 1,
        stage: turnStage,
        jobTitle: contextDataRef.current.jobTitle,
        candidateResume: contextDataRef.current.candidateResume,
        candidateContext: contextDataRef.current.candidateContext,
        conversationHistory: messages.map((m) => ({ speaker: m.role, text: m.content })),
      });

      transcriptData.current.push({
        question: lastAiQuestion.current || `Response for the ${role} role`,
        answer: text,
        feedback: '',
      });
      lastAiQuestion.current = response.text;
      setPhase(deriveNextInterviewPhase(response.stage));

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: response.text,
          timestamp: new Date().toLocaleTimeString(),
          analysis: response.analysis as Message['analysis'],
          turnRecord: response.turnRecord as Message['turnRecord'],
        },
      ]);
      setIsAnalyzing(false);
    } catch (err) {
      setAiRespondError(err instanceof Error ? err.message : 'Network error contacting AI service.');
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: 'I could not reach the AI voice engine, so this session cannot continue. Your recorded answers will be sent for evaluation.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsAnalyzing(false);
      setTimeout(handleComplete, 1200);
    }
  };

  const handleComplete = async () => {
    await endInterviewSession(interviewId, messagesRef.current);
    const results = evaluateCompletedInterview(role, transcriptData.current);
    onComplete(results);
  };

  const handleResumeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setShowWarningModal(false);
  };

  const handleEliminateCandidate = async () => {
    await endInterviewSession(interviewId, messagesRef.current);
    onComplete(createEliminationResult(messagesRef.current));
  };

  return {
    stage,
    phase,
    messages,
    timeRemaining,
    micActive,
    camActive,
    isAnalyzing,
    aiRespondError,
    proctorTelemetry,
    setProctorTelemetry,
    startSession,
    submitAnswer,
    wrapUp: handleComplete,
    toggleMic: () => setMicActive((p) => !p),
    toggleCam: () => setCamActive((p) => !p),
    setStage,
    showWarningModal,
    onResumeFullscreen: handleResumeFullscreen,
    onEliminate: handleEliminateCandidate,
  };
}
