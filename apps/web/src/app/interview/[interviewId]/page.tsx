'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import InterviewCheckScreen from '@/components/interview/InterviewCheckScreen';
import UnifiedInterviewConsole from '@/components/interview/UnifiedInterviewConsole';
import { ProctoringGate } from '@/components/interview/ProctoringGate';
import { useProctoringSession } from '@/lib/proctoring/useProctoringSession';
import { getProctoringFlagMessage } from '@/lib/proctoring/flagMessages';
import { useToast } from '@/contexts/ToastContext';
import { useInterviewRoomData } from './_hooks/useInterviewRoomData';
import { InterviewNotFoundScreen } from './_components/InterviewNotFoundScreen';

export default function LiveInterviewRoom({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const router = useRouter();
  const { interviewId } = use(params);
  const { toast } = useToast();
  const { app, candidateId, loadError } = useInterviewRoomData(interviewId);
  const [captureStream, setCaptureStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const companyName = app?.orgName || 'Interview';
  const jobTitle = app?.jobTitle || 'Candidate Interview';

  const {
    stage,
    phase,
    messages,
    timeRemaining,
    camActive,
    isAnalyzing,
    proctorTelemetry,
    startSession,
    submitAnswer,
    wrapUp,
    onEliminate: eliminateInterview,
  } = useInterviewSession({
    company: companyName,
    role: jobTitle,
    interviewId,
    onComplete: () => {
      router.push(`/candidate/applications/${interviewId}`);
    },
  });

  const {
    strikeCount: proctorStrikeCount,
    showWarningModal: proctorShowWarning,
    handleResumeFullscreen: proctorResumeFS,
    handleEnd: proctorEnd,
    suppressViolations,
    startCapture,
    proctoringClient,
  } = useProctoringSession({
    sessionId: interviewId,
    candidateId: candidateId || '',
    sessionType: 'interview',
    applicationId: interviewId,
    policyVersion: 'assessment-v1',
    consentVersion: 'v1',
    onViolationDetected: (kind) => {
      const msg = getProctoringFlagMessage(kind);
      if (msg) {
        toast({ title: msg.title, description: msg.description, variant: msg.variant });
      }
    },
    onDisqualified: () => {
      suppressViolations(true);
      proctorEnd().catch(() => {});
      eliminateInterview();
    },
  });

  const handleEndSession = async () => {
    suppressViolations(true);
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {}
    }
    try {
      await proctorEnd();
    } catch {
      // Ignored
    }
    wrapUp();
  };

  if (loadError) return <InterviewNotFoundScreen />;

  if (!app) {
    return (
      <div className="h-screen w-screen bg-slate-950 text-white flex items-center justify-center text-xs font-bold">
        Loading interview room...
      </div>
    );
  }

  if (stage === 'check') {
    if (candidateId && !captureStream) {
      return (
        <ProctoringGate
          company={companyName}
          role={jobTitle}
          onProceed={(stream) => {
            startCapture(stream);
            setCaptureStream(stream);
            startSession();
          }}
        />
      );
    }
    return (
      <InterviewCheckScreen
        company={companyName}
        role={jobTitle}
        camActive={camActive}
        onJoin={startSession}
      />
    );
  }

  return (
    <UnifiedInterviewConsole
      mode="ai-voice"
      companyName={companyName}
      jobTitle={jobTitle}
      timeRemaining={timeRemaining}
      messages={messages}
      phase={phase}
      isAnalyzing={isAnalyzing}
      proctorTelemetry={proctorTelemetry}
      onSubmitAnswer={submitAnswer}
      onEndSession={handleEndSession}
      proctoringClient={proctoringClient}
      strikeCount={proctorStrikeCount}
      showWarningModal={proctorShowWarning}
      onResumeFullscreen={proctorResumeFS}
      onEliminate={eliminateInterview}
    />
  );
}
