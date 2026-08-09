'use client';

import { useState, useEffect, useRef } from 'react';
import { getTopicsForRoleAndCompany } from '@/lib/interviewTopics';
import { evaluateInterview } from '@/lib/interviewScorer';
import { apiClient } from '@/lib/apiClient';

export interface Message {
  id: string;
  role: 'ai' | 'candidate';
  content: string;
  timestamp: string;
}

export type InterviewPhase = 'Introduction' | 'Core Vetting' | 'Deep-Dive' | 'Wrap-up';

interface UseInterviewSessionProps {
  company: string;
  role: string;
  difficulty?: string;
  storageKey: string;
  interviewId?: string;
  onComplete: (data: unknown) => void;
}

export function useInterviewSession({
  company,
  role,
  storageKey,
  interviewId,
  onComplete,
}: UseInterviewSessionProps) {
  const [stage, setStage] = useState<'check' | 'session' | 'fallback'>('check');
  const [phase, setPhase] = useState<InterviewPhase>('Introduction');
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 mins
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [proctorTelemetry, setProctorTelemetry] = useState({
    faceCount: null as number | null,
    gazeCentered: null as boolean | null,
    engagementIndex: null as number | null,
  });

  const topicIndex = useRef(0);
  const isFollowUp = useRef(false);
  const transcriptData = useRef<{ question: string; answer: string; feedback: string }[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const topics = getTopicsForRoleAndCompany(role, company);

  // Keep a ref mirror of messages so async callbacks (submitAnswer's timeouts,
  // handleComplete) read the latest transcript, not a stale render closure.
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (stage !== 'session' && stage !== 'fallback') return;
    const t = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [stage]);

  // Periodic proctoring telemetry logging to Express API (only real CV signals, never fabricated)
  useEffect(() => {
    if (stage !== 'session' || !interviewId) return;
    const pTimer = setInterval(async () => {
      try {
        await apiClient.patch(`/interviews/${interviewId}/proctoring`, {
          face_count: null,
          gaze_centered: null,
          engagement_index: null,
          multiple_faces_detected: null,
        });
      } catch {
        // Silently swallow background telemetry errors
      }
    }, 8000);
    return () => clearInterval(pTimer);
  }, [stage, interviewId]);

  const startSession = async () => {
    setStage('session');
    setPhase('Introduction');
    setIsAnalyzing(true);

    if (interviewId) {
      try {
        await apiClient.post(`/interviews/${interviewId}/consent`, { consent: true });
        await apiClient.post(`/interviews/${interviewId}/session-token`);
      } catch {
        // Continue with local session fallback
      }
    }

    setTimeout(() => {
      setMessages([
        {
          id: 'ai-init',
          role: 'ai',
          content: `Hello! Welcome to your AI voice interview for the ${role} position at ${company}. Let's begin. ${topics[0].question}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsAnalyzing(false);
    }, 1200);
  };

  const submitAnswer = async (text: string) => {
    if (!text.trim() || isAnalyzing) return;

    // eslint-disable-next-line react-hooks/purity
    const currentTimestamp = Date.now();
    const timestamp = new Date(currentTimestamp).toLocaleTimeString();
    setMessages((prev) => [...prev, { id: `c-${currentTimestamp}`, role: 'candidate', content: text, timestamp }]);
    setIsAnalyzing(true);

    // Call FastAPI voice response router if operational, or fallback to local stage logic
    let aiResponseText = '';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'}/api/v1/ai/interview/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interviewId || `intv_${currentTimestamp}`,
          transcript: text,
          turnNumber: messagesRef.current.length + 1,
          stage: phase === 'Introduction' ? 'intro' : phase === 'Core Vetting' ? 'technical' : 'closing',
          jobTitle: role,
          conversationHistory: messages.map(m => ({ speaker: m.role, text: m.content })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        aiResponseText = data.text;
      }
    } catch {
      // API fallback
    }

    setTimeout(() => {
      const currentTopic = topics[topicIndex.current] || topics[0];

      if (!isFollowUp.current) {
        transcriptData.current.push({
          question: currentTopic.question,
          answer: text,
          feedback: '',
        });

        setPhase('Deep-Dive');
        isFollowUp.current = true;
        const responseMsg = aiResponseText || currentTopic.followUp;
        setMessages((prev) => [
          ...prev,
          { id: `ai-${Date.now()}`, role: 'ai', content: responseMsg, timestamp: new Date().toLocaleTimeString() }
        ]);
        setIsAnalyzing(false);
      } else {
        isFollowUp.current = false;
        topicIndex.current += 1;

        if (topicIndex.current < topics.length) {
          setPhase('Core Vetting');
          const nextQ = aiResponseText || `Got it. Moving forward: ${topics[topicIndex.current].question}`;
          setMessages((prev) => [
            ...prev,
            { id: `ai-${Date.now()}`, role: 'ai', content: nextQ, timestamp: new Date().toLocaleTimeString() }
          ]);
          setIsAnalyzing(false);
        } else {
          setPhase('Wrap-up');
          const closingMsg = aiResponseText || `Thank you! That completes our technical evaluation. I will now package your scorecard for the hiring team.`;
          setMessages((prev) => [
            ...prev,
            { id: `ai-${Date.now()}`, role: 'ai', content: closingMsg, timestamp: new Date().toLocaleTimeString() }
          ]);
          setIsAnalyzing(false);
          setTimeout(handleComplete, 2500);
        }
      }
    }, 1500);
  };

  const handleComplete = async () => {
    if (interviewId) {
      try {
        // Send the latest messages via the ref so the saved transcript includes the
        // final candidate answer and closing AI message.
        await apiClient.post(`/interviews/${interviewId}/end`, { transcript: messagesRef.current });
      } catch {
        // Fallback swallow
      }
    }
    const results = evaluateInterview({ role, topics, transcriptData: transcriptData.current });
    localStorage.setItem(storageKey, JSON.stringify(results));
    onComplete(results);
  };

  const simulateSpeaking = () => {
    // No-op: fabricated speech simulation removed. Real candidates respond via live mic.
  };

  return {
    stage,
    phase,
    messages,
    timeRemaining,
    micActive,
    camActive,
    isAnalyzing,
    proctorTelemetry,
    setProctorTelemetry,
    startSession,
    submitAnswer,
    simulateSpeaking,
    wrapUp: handleComplete,
    toggleMic: () => setMicActive(p => !p),
    toggleCam: () => setCamActive(p => !p),
    setStage,
  };
}
