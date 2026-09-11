'use client';

import React, { useState, useEffect } from 'react';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import InterviewCheckScreen from '@/components/interview/InterviewCheckScreen';
import { useAssessmentDetails } from '@/components/interview/useAssessmentDetails';
import { useAssessmentCompletion } from '@/components/interview/useAssessmentCompletion';
import { useProctoringSession } from '@/lib/proctoring/useProctoringSession';
import { getProctoringFlagMessage } from '@/lib/proctoring/flagMessages';
import { useToast } from '@/contexts/ToastContext';
import { ProctoringGate } from '@/components/interview/ProctoringGate';
import { useCandidateProfileId } from './unified/useCandidateProfileId';
import { UnifiedStageRenderer, InterRoundData } from './unified/UnifiedStageRenderer';

export interface UnifiedAssessmentSessionProps {
  sessionId: string;
  applicationId?: string;
  track?: string;
  company?: string;
  role?: string;
}

export function UnifiedAssessmentSession({
  sessionId,
  applicationId,
  track = 'technical',
  company,
  role,
}: UnifiedAssessmentSessionProps) {
  const { toast } = useToast();
  const { targetCompany, targetRole } = useAssessmentDetails({ sessionId, applicationId, company, role });
  const candidateId = useCandidateProfileId();

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const [comprehensiveStep, setComprehensiveStep] = useState<'aptitude' | 'coding' | 'technical'>('aptitude');
  const [pendingNextRound, setPendingNextRound] = useState<InterRoundData | null>(null);
  const [captureStream, setCaptureStream] = useState<MediaStream | null>(null);

  const {
    stage,
    phase,
    messages,
    timeRemaining,
    camActive,
    isAnalyzing,
    startSession,
    submitAnswer,
    onEliminate,
  } = useInterviewSession({
    company: targetCompany,
    role: targetRole,
    interviewId: applicationId || sessionId,
    onComplete: (results) => {
      const score =
        results && typeof results === 'object' && 'score' in results
          ? (results as { score?: number }).score
          : undefined;
      handleCompleteWithProctor(score);
    },
  });

  const handleComplete = useAssessmentCompletion({ sessionId, applicationId, messages });

  const {
    strikeCount: proctorStrikeCount,
    showWarningModal: proctorShowWarning,
    handleResumeFullscreen: proctorResumeFS,
    handleEnd: proctorEnd,
    suppressViolations,
    startCapture,
    recordingActive,
    recordingDurationMs,
    proctoringClient,
  } = useProctoringSession({
    sessionId,
    candidateId: candidateId || '',
    sessionType:
      track === 'coding'
        ? 'coding'
        : track === 'aptitude'
        ? 'aptitude'
        : track === 'video'
        ? 'video'
        : 'interview',
    applicationId: applicationId || undefined,
    mockSessionId: applicationId ? undefined : sessionId,
    policyVersion: 'assessment-v1',
    consentVersion: 'v1',
    onViolationDetected: (kind) => {
      const msg = getProctoringFlagMessage(kind);
      if (msg) {
        toast({ title: msg.title, description: msg.description, variant: msg.variant });
      }
    },
    onDisqualified: () => {
      if (track === 'comprehensive') {
        onEliminate();
      } else {
        handleCompleteWithProctor(0);
      }
    },
  });

  const handleCompleteWithProctor = async (score?: number) => {
    suppressViolations(true);
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {}
    }
    try {
      await proctorEnd();
    } catch {}
    handleComplete(score);
  };

  const activeRoundTrack = track === 'comprehensive' ? comprehensiveStep : track;

  const handleLaunchNextRound = () => {
    if (!pendingNextRound) return;
    suppressViolations(false);
    setComprehensiveStep(pendingNextRound.nextStep);
    setPendingNextRound(null);
  };

  const needsProctoringGate =
    (track === 'aptitude' || track === 'coding' || track === 'comprehensive') &&
    !!candidateId &&
    !captureStream;

  const handleGateProceed = (stream: MediaStream) => {
    startCapture(stream);
    setCaptureStream(stream);
    startSession();
  };

  if (stage === 'check') {
    if (needsProctoringGate) {
      return <ProctoringGate company={targetCompany} role={targetRole} onProceed={handleGateProceed} />;
    }
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto transition-colors duration-300">
        <InterviewCheckScreen
          company={targetCompany}
          role={targetRole}
          camActive={camActive}
          onJoin={startSession}
        />
      </div>
    );
  }

  return (
    <UnifiedStageRenderer
      activeRoundTrack={activeRoundTrack}
      targetCompany={targetCompany}
      targetRole={targetRole}
      applicationId={applicationId}
      sessionId={sessionId}
      track={track}
      pendingNextRound={pendingNextRound}
      onLaunchNextRound={handleLaunchNextRound}
      onStageComplete={(score, nextData) => {
        if (nextData) setPendingNextRound(nextData);
        else handleCompleteWithProctor(score);
      }}
      onEndSession={handleCompleteWithProctor}
      proctoringClient={proctoringClient}
      proctorStrikeCount={proctorStrikeCount}
      proctorShowWarning={proctorShowWarning}
      proctorResumeFS={proctorResumeFS}
      recordingActive={recordingActive}
      recordingDurationMs={recordingDurationMs}
      timeRemaining={timeRemaining}
      messages={messages}
      phase={phase}
      isAnalyzing={isAnalyzing}
      onSubmitAnswer={submitAnswer}
      onEliminate={onEliminate}
    />
  );
}
