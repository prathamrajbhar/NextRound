'use client';

import { useState, useEffect, useRef } from 'react';
import { evaluateInterview } from '@/lib/interviewScorer';
import { apiClient } from '@/lib/apiClient';
import { siteConfig } from '@/lib/config';
import type { Message, InterviewPhase } from '@/components/interview/console/types';

export type { Message, InterviewPhase };

interface UseInterviewSessionProps {
  company: string;
  role: string;
  interviewId: string;
  onComplete: (data: unknown) => void;
}

export function useInterviewSession({
  role,
  interviewId,
  onComplete,
}: UseInterviewSessionProps) {
  const [stage, setStage] = useState<'check' | 'session' | 'fallback'>('check');
  const [phase, setPhase] = useState<InterviewPhase>('Introduction');
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(900);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRespondError, setAiRespondError] = useState<string | null>(null);
  const [proctorTelemetry, setProctorTelemetry] = useState({
    faceCount: null as number | null,
    gazeCentered: null as boolean | null,
    engagementIndex: null as number | null,
  });
  const [showWarningModal, setShowWarningModal] = useState(false);

  const transcriptData = useRef<{ question: string; answer: string; feedback: string }[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const lastAiQuestion = useRef('');
  const candidateResumeRef = useRef('');
  const candidateContextRef = useRef<Record<string, unknown> | null>(null);
  const jobTitleRef = useRef(role);
  const aiAnalysisRef = useRef<Message['analysis'] | null>(null);
  const aiTurnRecordRef = useRef<Message['turnRecord'] | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (stage !== 'session' && stage !== 'fallback') return;
    if (showWarningModal) return;
    const t = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [stage, showWarningModal]);

  const startSession = async () => {
    setStage('session');
    setPhase('Introduction');
    setIsAnalyzing(true);

    const fsPromise = !document.fullscreenElement
      ? document.documentElement.requestFullscreen().catch(() => undefined)
      : Promise.resolve();

    if (interviewId) {
      try {
        await apiClient.post(`/interviews/${interviewId}/consent`, { consent: true });
        await apiClient.post(`/interviews/${interviewId}/session-token`);
      } catch {}
      try {
        const ctx = await apiClient.get<{
          context?: {
            job?: { title?: string; skills?: string[]; rubric?: Record<string, unknown> };
          };
          contextText?: string;
        }>(`/interviews/${interviewId}/context`);
        if (ctx?.contextText) candidateResumeRef.current = ctx.contextText;
        if (ctx?.context) {
          candidateContextRef.current = ctx.context as unknown as Record<string, unknown>;
        }
        if (ctx?.context?.job?.title) jobTitleRef.current = ctx.context.job.title;
      } catch {}
    }

    await fsPromise;

    let greeting = '';
    let hasError = false;
    try {
      const res = await fetch(`${siteConfig.aiServiceUrl}/api/v1/ai/interview/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          transcript: '',
          turnNumber: 0,
          stage: 'intro',
          jobTitle: jobTitleRef.current || role,
          candidateResume: candidateResumeRef.current || undefined,
          candidateContext: candidateContextRef.current || undefined,
          conversationHistory: [],
        }),
      });
      if (!res.ok) {
        hasError = true;
        setAiRespondError(`AI respond failed: ${res.status} ${res.statusText}`);
      } else {
        const data = await res.json();
        if (data && typeof data.text === 'string' && data.text.trim()) {
          greeting = data.text;
        } else {
          hasError = true;
          setAiRespondError('AI returned an unexpected response format.');
        }
      }
    } catch (err) {
      hasError = true;
      setAiRespondError(err instanceof Error ? err.message : 'Network error contacting AI service.');
    }

    if (hasError || !greeting) {
      setMessages([
        {
          id: 'ai-init-error',
          role: 'ai',
          content: 'I could not reach the AI voice engine to start the session. Please check your connection and try again.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsAnalyzing(false);
      return;
    }

    lastAiQuestion.current = greeting;
    setMessages([
      {
        id: 'ai-init',
        role: 'ai',
        content: greeting,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setIsAnalyzing(false);
  };

  const submitAnswer = async (text: string) => {
    if (!text.trim() || isAnalyzing) return;

    
    const currentTimestamp = Date.now();
    const timestamp = new Date(currentTimestamp).toLocaleTimeString();
    setMessages((prev) => [...prev, { id: `c-${currentTimestamp}`, role: 'candidate', content: text, timestamp }]);
    setIsAnalyzing(true);

    let aiResponseText = '';
    let nextStage = '';
    setAiRespondError(null);
    try {
      const res = await fetch(`${siteConfig.aiServiceUrl}/api/v1/ai/interview/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          transcript: text,
          turnNumber: messagesRef.current.length + 1,
          stage: phase === 'Introduction' ? 'intro' : phase === 'Core Vetting' ? 'technical' : 'closing',
          jobTitle: jobTitleRef.current || role,
          candidateResume: candidateResumeRef.current || undefined,
          candidateContext: candidateContextRef.current || undefined,
          conversationHistory: messages.map(m => ({ speaker: m.role, text: m.content })),
        }),
      });
      if (!res.ok) {
        const errMsg = `AI respond failed: ${res.status} ${res.statusText}`;
        console.error(`[interview] ${errMsg}`);
        setAiRespondError(errMsg);
      } else {
        const data = await res.json();
        if (data && typeof data.text === 'string' && data.text.trim()) {
          aiResponseText = data.text;
          nextStage = data.stage || '';
          aiAnalysisRef.current = data.analysis || null;
          aiTurnRecordRef.current = data.turnRecord || null;
        } else {
          console.error('[interview] AI respond returned a malformed response without a text field', data);
          setAiRespondError('AI returned an unexpected response format.');
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Network error contacting AI service.';
      console.error('[interview] AI respond request failed', err);
      setAiRespondError(errMsg);
    }

    setTimeout(() => {
      if (aiResponseText) {
        transcriptData.current.push({
          question: lastAiQuestion.current || `Response for the ${role} role`,
          answer: text,
          feedback: '',
        });

        lastAiQuestion.current = aiResponseText;

        let nextPhase: InterviewPhase = 'Core Vetting';
        if (nextStage === 'intro') {
          nextPhase = 'Introduction';
        } else if (nextStage === 'closing') {
          nextPhase = 'Wrap-up';
        }
        setPhase(nextPhase);

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'ai',
            content: aiResponseText,
            timestamp: new Date().toLocaleTimeString(),
            analysis: aiAnalysisRef.current || undefined,
            turnRecord: aiTurnRecordRef.current || undefined,
          }
        ]);
        setIsAnalyzing(false);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'ai',
            content: 'I could not reach the AI voice engine, so this session cannot continue. Your recorded answers will be sent for evaluation.',
            timestamp: new Date().toLocaleTimeString(),
          }
        ]);
        setIsAnalyzing(false);
        setTimeout(handleComplete, 1200);
      }
    }, 1500);
  };

  const handleComplete = async () => {
    if (interviewId) {
      try {
        await apiClient.post(`/interviews/${interviewId}/end`, { transcript: messagesRef.current });
      } catch (err) {
        console.error('[interview] Failed to persist transcript to backend', err);
      }
    }
    const results = evaluateInterview({ role, transcriptData: transcriptData.current });
    onComplete(results);
  };

  const handleResumeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    }
    setShowWarningModal(false);
  };

  const handleEliminateCandidate = async () => {
    if (interviewId) {
      try {
        await apiClient.post(`/interviews/${interviewId}/end`, { transcript: messagesRef.current });
      } catch (err) {
        console.error('[interview] Failed to persist transcript to backend on elimination', err);
      }
    }
    const results = {
      status: 'completed' as const,
      isPending: false,
      score: 0,
      feedback: 'Disqualified due to proctoring violations.',
      rubric: { technical: 0, communication: 0, cultureFit: 0 },
      transcript: messagesRef.current.map((item) => ({
        question: item.role === 'ai' ? item.content : '',
        answer: item.role === 'candidate' ? item.content : '',
        feedback: '',
      })),
    };
    onComplete(results);
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
    toggleMic: () => setMicActive(p => !p),
    toggleCam: () => setCamActive(p => !p),
    setStage,
    showWarningModal,
    onResumeFullscreen: handleResumeFullscreen,
    onEliminate: handleEliminateCandidate,
  };
}
