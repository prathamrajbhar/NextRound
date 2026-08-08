'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import { ATSResumeData, DynamicConversationTurn } from '@/types';
import { useLocalMediaStream } from '@/hooks/useLocalMediaStream';
import { SetupStage } from './_components/SetupStage';
import { InterviewStage } from './_components/InterviewStage';
import { ResumeStage } from './_components/ResumeStage';

const DEFAULT_DYNAMIC_TURNS: DynamicConversationTurn[] = [];

const DEFAULT_GENERATED_RESUME: ATSResumeData = {
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  summary: '',
  atsScore: 0,
  scoreBreakdown: [],
  experience: [],
  projects: [],
  skills: [],
  education: [],
  certifications: [],
};

type Stage = 'setup' | 'interview' | 'resume';

export default function AIResumeBuilderPage() {
  const [stage, setStage] = useState<Stage>('setup');

  // Setup Form
  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Senior (5+ Years)');

  // Production Interview Call State
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);

  const [turnIndex, setTurnIndex] = useState(0);
  const [aiState, setAiState] = useState<'speaking' | 'listening' | 'evaluating'>('speaking');
  const [candidateSpeechText] = useState('');

  // Dynamic Turns State
  const [dynamicTurns] = useState<DynamicConversationTurn[]>(DEFAULT_DYNAMIC_TURNS);

  // Resume State
  const [resumeData] = useState<ATSResumeData>(DEFAULT_GENERATED_RESUME);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern' | 'executive'>('classic');
  const [copiedText, setCopiedText] = useState(false);

  // Video Ref for Local WebCam Feed
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentTurn = dynamicTurns[turnIndex] && { aiMessage: dynamicTurns[turnIndex].aiMessage, simulatedUserAnswer: dynamicTurns[turnIndex].simulatedUserAnswer };

  // Local webcam feed during interview stage (video-only); released when the stage leaves
  // 'interview' or the component unmounts (unmount cleanup + pagehide handler).
  useLocalMediaStream({
    videoRef,
    camActive,
    micActive: false,
    enabled: stage === 'interview',
  });

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, timeRemaining]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleStartCall = async () => {
    if (dynamicTurns.length === 0) {
      // No live conversation turns are available yet; surface an empty resume state.
      setStage('resume');
      return;
    }
    setStage('interview');
    setTimeRemaining(900);
    setIsTimerRunning(true);
    setTurnIndex(0);
    setAiState('speaking');

    try {
      const res = await apiClient.post<{ sessionId: string }>('/resume-builder/sessions', {
        targetRole,
        experienceLevel,
      });
      if (res?.sessionId) {
        setSessionId(res.sessionId);
      }
    } catch (err) {
      console.error('Failed to create resume builder session:', err);
    }

    setTimeout(() => {
      setAiState('listening');
    }, 3000);
  };

  const handleEndCall = async () => {
    setIsTimerRunning(false);
    setStage('resume');
    if (sessionId) {
      try {
        await apiClient.post(`/resume-builder/${sessionId}/end`, {
          transcript: [],
        });
      } catch (err) {
        console.error('Failed to end resume builder session:', err);
      }
    }
  };

  const handleCopyResumeText = () => {
    const fullText = `${resumeData.name}\n${resumeData.title} | ${resumeData.email} | ${resumeData.phone}\n${resumeData.location}\n\nSUMMARY\n${resumeData.summary}\n\nEXPERIENCE\n` +
      resumeData.experience.map(e => `${e.role} - ${e.company} (${e.period})\n` + e.highlights.map(h => `• ${h}`).join('\n')).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between pb-2 animate-in fade-in duration-300">
      {stage === 'setup' && (
        <SetupStage
          targetRole={targetRole}
          setTargetRole={setTargetRole}
          experienceLevel={experienceLevel}
          setExperienceLevel={setExperienceLevel}
          onStartCall={handleStartCall}
        />
      )}

      {stage === 'interview' && (
        <InterviewStage
          targetRole={targetRole}
          experienceLevel={experienceLevel}
          timeRemaining={timeRemaining}
          formatTimer={formatTimer}
          aiState={aiState}
          currentTurn={currentTurn}
          videoRef={videoRef}
          camActive={camActive}
          setCamActive={setCamActive}
          micActive={micActive}
          setMicActive={setMicActive}
          candidateSpeechText={candidateSpeechText}
          onEndCall={handleEndCall}
        />
      )}

      {stage === 'resume' && (
        <ResumeStage
          resumeData={resumeData}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          copiedText={copiedText}
          onCopyResumeText={handleCopyResumeText}
          onRestart={() => setStage('setup')}
        />
      )}
    </div>
  );
}

