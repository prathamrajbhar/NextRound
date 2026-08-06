'use client';

import { useState, useEffect, useRef } from 'react';
import { getTopicsForRoleAndCompany, defaultAnswers } from '@/lib/interviewTopics';
import { evaluateInterview } from '@/lib/interviewScorer';

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
  const [isSimulating, setIsSimulating] = useState(false);
  const [proctorTelemetry, setProctorTelemetry] = useState({
    faceCount: 1,
    gazeCentered: true,
    engagementIndex: 96,
  });

  const topicIndex = useRef(0);
  const isFollowUp = useRef(false);
  const transcriptData = useRef<{ question: string; answer: string; feedback: string }[]>([]);
  const topics = getTopicsForRoleAndCompany(role, company);

  useEffect(() => {
    if (stage !== 'session' && stage !== 'fallback') return;
    const t = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [stage]);

  // Periodic proctoring telemetry logging to Express API
  useEffect(() => {
    if (stage !== 'session' || !interviewId) return;
    const pTimer = setInterval(async () => {
      try {
        const gaze = Math.random() > 0.1;
        const eng = Math.floor(Math.random() * 8) + 92;
        setProctorTelemetry({ faceCount: 1, gazeCentered: gaze, engagementIndex: eng });

        await fetch(`/api/v1/interviews/${interviewId}/proctoring`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            face_count: 1,
            gaze_centered: gaze,
            engagement_index: eng,
            multiple_faces_detected: false,
          }),
        });
      } catch (err) {
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
        await fetch(`/api/v1/interviews/${interviewId}/consent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consent: true }),
        });
        await fetch(`/api/v1/interviews/${interviewId}/session-token`, { method: 'POST' });
      } catch (e) {
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
      const res = await fetch('http://localhost:8000/api/v1/ai/interview/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interviewId || `intv_${currentTimestamp}`,
          transcript: text,
          turnNumber: messages.length + 1,
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
          feedback: `Good response on ${currentTopic.topic}.`
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
        await fetch(`/api/v1/interviews/${interviewId}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: messages }),
        });
      } catch (e) {
        // Fallback swallow
      }
    }
    const results = evaluateInterview({ role, topics, transcriptData: transcriptData.current });
    localStorage.setItem(storageKey, JSON.stringify(results));
    onComplete(results);
  };

  const simulateSpeaking = () => {
    if (isSimulating || isAnalyzing) return;
    setIsSimulating(true);

    const currentTopic = topics[topicIndex.current];
    const targetQuestion = messages[messages.length - 1]?.content || '';
    const answer = defaultAnswers[targetQuestion] || defaultAnswers[currentTopic.question] || 'I would organize modular layers and validate inputs.';

    let currentLen = 0;
    const words = answer.split(' ');
    let currentText = '';

    const interval = setInterval(() => {
      if (currentLen < words.length) {
        currentText += (currentLen > 0 ? ' ' : '') + words[currentLen];
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === 'candidate' && last.id.startsWith('c-sim-')) {
            last.content = currentText;
            return next;
          } else {
            return [...next, { id: `c-sim-${Date.now()}`, role: 'candidate', content: currentText, timestamp: new Date().toLocaleTimeString() }];
          }
        });
        currentLen++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        setMessages((prev) => prev.filter(m => !m.id.startsWith('c-sim-')));
        submitAnswer(answer);
      }
    }, 100);
  };

  return {
    stage,
    phase,
    messages,
    timeRemaining,
    micActive,
    camActive,
    isAnalyzing,
    isSimulating,
    proctorTelemetry,
    startSession,
    submitAnswer,
    simulateSpeaking,
    wrapUp: handleComplete,
    toggleMic: () => setMicActive(p => !p),
    toggleCam: () => setCamActive(p => !p),
    setStage,
  };
}
