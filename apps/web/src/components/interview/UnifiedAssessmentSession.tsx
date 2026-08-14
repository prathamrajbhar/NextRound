'use client';

import React, { useState, useEffect } from 'react';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import InterviewCheckScreen from '@/components/interview/InterviewCheckScreen';
import UnifiedInterviewConsole from '@/components/interview/UnifiedInterviewConsole';
import AptitudeTestConsole from '@/components/interview/AptitudeTestConsole';
import CodingAssessmentConsole from '@/components/interview/CodingAssessmentConsole';
import { AssessmentStageShell } from '@/components/interview/AssessmentStageShell';
import { NextRoundTransitionCard } from '@/components/interview/NextRoundTransitionCard';
import { useAssessmentDetails } from '@/components/interview/useAssessmentDetails';
import { useAssessmentCompletion } from '@/components/interview/useAssessmentCompletion';
import { useProctoringSession } from '@/lib/proctoring/useProctoringSession';
import { ProctoringGate } from '@/components/interview/ProctoringGate';
import { apiClient } from '@/lib/apiClient';

interface InterRoundData {
  completedStageName: string;
  completedScore: number;
  nextStageName: string;
  nextStep: 'coding' | 'technical';
  stageNumber: number;
}

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
  const { targetCompany, targetRole, difficulty } = useAssessmentDetails({ sessionId, applicationId, company, role });

  const [comprehensiveStep, setComprehensiveStep] = useState<'aptitude' | 'coding' | 'technical'>('aptitude');
  const [pendingNextRound, setPendingNextRound] = useState<InterRoundData | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [captureStream, setCaptureStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await apiClient.get<{ profile: { id: string } }>('/candidate/profile');
        if (res && res.profile) {
          setCandidateId(res.profile.id);
        }
      } catch (err) {
        console.warn('Failed to load candidate profile for proctoring:', err);
      }
    }
    loadProfile();
  }, []);

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
    difficulty,
    storageKey: `mockSession_${sessionId}`,
    onComplete: (results) => {
      const score = results && typeof results === 'object' && 'score' in results ? (results as { score?: number }).score : undefined;
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
    sessionType: track === 'coding' ? 'coding' : track === 'aptitude' ? 'aptitude' : track === 'video' ? 'video' : 'interview',
    applicationId: applicationId || undefined,
    mockSessionId: applicationId ? undefined : sessionId,
    policyVersion: 'assessment-v1',
    consentVersion: 'v1',
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
    } catch (err) {
      console.error('Failed to end proctoring session:', err);
    }
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

  if (pendingNextRound) {
    return (
      <NextRoundTransitionCard
        companyName={targetCompany}
        roleTitle={targetRole}
        stageNumber={pendingNextRound.stageNumber}
        completedStageName={pendingNextRound.completedStageName}
        completedScore={pendingNextRound.completedScore}
        nextStageName={pendingNextRound.nextStageName}
        onLaunch={handleLaunchNextRound}
      />
    );
  }

  if (activeRoundTrack === 'aptitude') {
    return (
      <AssessmentStageShell>
        <AptitudeTestConsole
          company={targetCompany}
          role={targetRole}
          applicationId={applicationId}
          sessionId={sessionId}
          proctoringClient={proctoringClient}
          strikeCount={proctorStrikeCount}
          showWarningModal={proctorShowWarning}
          onResumeFullscreen={proctorResumeFS}
          recordingActive={recordingActive}
          recordingDurationMs={recordingDurationMs}
          onComplete={(score) => {
            if (track === 'comprehensive') {
              setPendingNextRound({
                completedStageName: 'Aptitude & Reasoning Test',
                completedScore: score,
                nextStageName: 'Live Coding Round',
                nextStep: 'coding',
                stageNumber: 1,
              });
            } else {
              handleCompleteWithProctor(score);
            }
          }}
        />
      </AssessmentStageShell>
    );
  }

  if (activeRoundTrack === 'coding') {
    return (
      <AssessmentStageShell>
        <CodingAssessmentConsole
          company={targetCompany}
          role={targetRole}
          applicationId={applicationId}
          sessionId={sessionId}
          proctoringClient={proctoringClient}
          strikeCount={proctorStrikeCount}
          showWarningModal={proctorShowWarning}
          onResumeFullscreen={proctorResumeFS}
          recordingActive={recordingActive}
          recordingDurationMs={recordingDurationMs}
          onComplete={(score) => {
            if (track === 'comprehensive') {
              setPendingNextRound({
                completedStageName: 'Live Coding Round',
                completedScore: score,
                nextStageName: 'Technical Voice AI',
                nextStep: 'technical',
                stageNumber: 2,
              });
            } else {
              handleCompleteWithProctor(score);
            }
          }}
        />
      </AssessmentStageShell>
    );
  }

  return (
    <UnifiedInterviewConsole
      mode="mock-practice"
      companyName={targetCompany}
      jobTitle={targetRole}
      timeRemaining={timeRemaining}
      messages={messages}
      phase={phase}
      isAnalyzing={isAnalyzing}
      onSubmitAnswer={submitAnswer}
      onEndSession={handleCompleteWithProctor}
      strikeCount={proctorStrikeCount}
      showWarningModal={proctorShowWarning}
      onResumeFullscreen={proctorResumeFS}
      onEliminate={onEliminate}
      proctoringClient={proctoringClient}
    />
  );
}
