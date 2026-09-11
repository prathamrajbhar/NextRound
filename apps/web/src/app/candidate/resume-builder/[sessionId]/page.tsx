'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalMediaStream } from '@/hooks/useLocalMediaStream';
import { apiClient } from '@/lib/apiClient';
import { InterviewStage } from '../_components/InterviewStage';
import { ResumeStage } from '../_components/ResumeStage';
import { useResumeVoiceSession } from '../_hooks/useResumeVoiceSession';
import { useResumePolling, ResumeStatus } from './components/useResumePolling';
import { useResumeSessionDetails } from './components/useResumeSessionDetails';
import {
  LoadingSessionView,
  SessionAccessDeniedView,
  ResumeGeneratingView,
  ResumeErrorView,
} from './components/ResumeGenerationStateViews';

export default function AIResumeBuilderSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [resumeStatus, setResumeStatus] = useState<ResumeStatus>('idle');
  const details = useResumeSessionDetails({ sessionId, setResumeStatus });
  const { stage, setStage, targetRole, experienceLevel, existingResumeText, careerGoals } = details;

  const [timeRemaining, setTimeRemaining] = useState(900);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern' | 'executive'>('classic');
  const [copiedText, setCopiedText] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const callStartedRef = useRef(false);

  const voice = useResumeVoiceSession({
    targetRole,
    experienceLevel,
    initialSessionId: sessionId,
    existingResume: existingResumeText,
    careerGoals,
    onComplete: () => {
      setIsTimerRunning(false);
      setStage('resume');
      setResumeStatus('generating');
    },
  });

  const { startCall, endCall, abortCall } = voice;

  useEffect(() => {
    if (stage === 'interview' && !details.loadingSession && !callStartedRef.current) {
      callStartedRef.current = true;
      setTimeRemaining(900);
      setIsTimerRunning(true);
      void startCall();
    }
  }, [stage, details.loadingSession, startCall]);

  const { micLevel } = useLocalMediaStream({
    videoRef,
    camActive: voice.camActive,
    micActive: voice.micActive,
    enabled: stage === 'interview',
  });

  useEffect(() => {
    if (!isTimerRunning || timeRemaining <= 0) return;
    const timer = setInterval(() => setTimeRemaining((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, timeRemaining]);

  const { resumeData } = useResumePolling({
    sessionId,
    stage,
    resumeStatus,
    targetRole,
    setResumeStatus,
  });

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    setIsTimerRunning(false);
    await endCall();
  };

  const handleCancelCall = () => {
    setIsTimerRunning(false);
    abortCall();
    router.push('/candidate/resume-builder');
  };

  const handleCopyResumeText = () => {
    const fullText =
      `${resumeData.name}\n${resumeData.title} | ${resumeData.email} | ${resumeData.phone}\n${resumeData.location}\n\nSUMMARY\n${resumeData.summary}\n\nEXPERIENCE\n` +
      resumeData.experience
        .map((e) => `${e.role} - ${e.company} (${e.period})\n` + e.highlights.map((h) => `• ${h}`).join('\n'))
        .join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleRetryGeneration = async () => {
    setResumeStatus('generating');
    try {
      await apiClient.post(`/resume-builder/${sessionId}/end`, {
        transcript: voice.conversationHistory.map((h) => ({
          speaker: h.role,
          text: h.content,
        })),
      });
    } catch {
      // Non-blocking retry
    }
  };

  const lastAiMessage =
    [...voice.conversationHistory].reverse().find((h) => h.role === 'ai')?.content ||
    'Connecting to AI voice agent...';

  if (details.loadingSession) return <LoadingSessionView />;
  if (details.sessionError) {
    return (
      <SessionAccessDeniedView
        sessionError={details.sessionError}
        onGoBack={() => router.push('/candidate/resume-builder')}
      />
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col justify-between pb-2 animate-in fade-in duration-300">
      {stage === 'interview' && (
        <InterviewStage
          targetRole={targetRole}
          experienceLevel={experienceLevel}
          timeRemaining={timeRemaining}
          formatTimer={formatTimer}
          aiState={voice.aiState}
          currentTurn={{ aiMessage: lastAiMessage }}
          conversationHistory={voice.conversationHistory}
          videoRef={videoRef}
          camActive={voice.camActive}
          setCamActive={voice.setCamActive}
          micActive={voice.micActive}
          setMicActive={voice.toggleMic}
          micLevel={voice.micActive ? micLevel : 0}
          candidateSpeechText={voice.candidateSpeechText}
          realtimeInsight={voice.realtimeInsight}
          voiceError={voice.error}
          onReplayAudio={voice.replayLastAudio}
          onSubmitResponse={voice.submitResponse}
          onEndCall={handleEndCall}
          onCancelCall={handleCancelCall}
        />
      )}

      {stage === 'resume' && (
        <>
          {resumeStatus === 'generating' && <ResumeGeneratingView />}
          {resumeStatus === 'error' && (
            <ResumeErrorView
              onRetry={handleRetryGeneration}
              onStartNew={() => router.push('/candidate/resume-builder')}
            />
          )}
          {resumeStatus === 'completed' && (
            <ResumeStage
              resumeData={resumeData}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              copiedText={copiedText}
              onCopyResumeText={handleCopyResumeText}
              onRestart={() => router.push('/candidate/resume-builder')}
            />
          )}
        </>
      )}
    </div>
  );
}
