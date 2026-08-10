'use client';

import React, { useState } from 'react';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import InterviewCheckScreen from '@/components/interview/InterviewCheckScreen';
import UnifiedInterviewConsole from '@/components/interview/UnifiedInterviewConsole';
import AptitudeTestConsole from '@/components/interview/AptitudeTestConsole';
import CodingAssessmentConsole from '@/components/interview/CodingAssessmentConsole';
import { AssessmentStageShell } from '@/components/interview/AssessmentStageShell';
import { NextRoundTransitionCard } from '@/components/interview/NextRoundTransitionCard';
import { useAssessmentDetails } from '@/components/interview/useAssessmentDetails';
import { useAssessmentCompletion } from '@/components/interview/useAssessmentCompletion';

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

  const {
    stage,
    phase,
    messages,
    timeRemaining,
    camActive,
    isAnalyzing,
    startSession,
    submitAnswer,
    wrapUp,
    strikeCount,
    showWarningModal,
    onResumeFullscreen,
    onEliminate,
  } = useInterviewSession({
    company: targetCompany,
    role: targetRole,
    difficulty,
    storageKey: `mockSession_${sessionId}`,
    onComplete: (results) => {
      const score = results && typeof results === 'object' && 'score' in results ? (results as any).score : undefined;
      handleComplete(score);
    },
  });

  const handleComplete = useAssessmentCompletion({ sessionId, applicationId, messages });

  const activeRoundTrack = track === 'comprehensive' ? comprehensiveStep : track;

  const handleLaunchNextRound = () => {
    if (!pendingNextRound) return;
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    }

    setComprehensiveStep(pendingNextRound.nextStep);
    setPendingNextRound(null);
  };

  if (stage === 'check') {
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
              handleComplete(score);
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
              handleComplete(score);
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
      onEndSession={wrapUp}
      strikeCount={strikeCount}
      showWarningModal={showWarningModal}
      onResumeFullscreen={onResumeFullscreen}
      onEliminate={onEliminate}
    />
  );
}
