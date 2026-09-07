'use client';

import React from 'react';
import UnifiedInterviewConsole from '@/components/interview/UnifiedInterviewConsole';
import AptitudeTestConsole from '@/components/interview/AptitudeTestConsole';
import CodingAssessmentConsole from '@/components/interview/CodingAssessmentConsole';
import { AssessmentStageShell } from '@/components/interview/AssessmentStageShell';
import { NextRoundTransitionCard } from '@/components/interview/NextRoundTransitionCard';
import type { Message, InterviewPhase } from '@/components/interview/console/types';
import { ProctoringClient } from '@/lib/proctoring/ProctoringClient';

export interface InterRoundData {
  completedStageName: string;
  completedScore: number;
  nextStageName: string;
  nextStep: 'coding' | 'technical';
  stageNumber: number;
}

interface UnifiedStageRendererProps {
  activeRoundTrack: string;
  targetCompany: string;
  targetRole: string;
  applicationId?: string;
  sessionId: string;
  track: string;
  pendingNextRound: InterRoundData | null;
  onLaunchNextRound: () => void;
  onStageComplete: (score: number, nextData?: InterRoundData) => void;
  onEndSession: (score?: number) => void;
  proctoringClient: ProctoringClient | null;
  proctorStrikeCount: number;
  proctorShowWarning: boolean;
  proctorResumeFS: () => void;
  recordingActive: boolean;
  recordingDurationMs: number;
  timeRemaining: number;
  messages: Message[];
  phase: InterviewPhase;
  isAnalyzing: boolean;
  onSubmitAnswer: (text: string) => void;
  onEliminate: () => void;
}

export function UnifiedStageRenderer({
  activeRoundTrack,
  targetCompany,
  targetRole,
  applicationId,
  sessionId,
  track,
  pendingNextRound,
  onLaunchNextRound,
  onStageComplete,
  onEndSession,
  proctoringClient,
  proctorStrikeCount,
  proctorShowWarning,
  proctorResumeFS,
  recordingActive,
  recordingDurationMs,
  timeRemaining,
  messages,
  phase,
  isAnalyzing,
  onSubmitAnswer,
  onEliminate,
}: UnifiedStageRendererProps) {
  if (pendingNextRound) {
    return (
      <NextRoundTransitionCard
        companyName={targetCompany}
        roleTitle={targetRole}
        stageNumber={pendingNextRound.stageNumber}
        completedStageName={pendingNextRound.completedStageName}
        completedScore={pendingNextRound.completedScore}
        nextStageName={pendingNextRound.nextStageName}
        onLaunch={onLaunchNextRound}
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
              onStageComplete(score, {
                completedStageName: 'Aptitude & Reasoning Test',
                completedScore: score,
                nextStageName: 'Live Coding Round',
                nextStep: 'coding',
                stageNumber: 1,
              });
            } else {
              onEndSession(score);
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
              onStageComplete(score, {
                completedStageName: 'Live Coding Round',
                completedScore: score,
                nextStageName: 'Technical Voice AI',
                nextStep: 'technical',
                stageNumber: 2,
              });
            } else {
              onEndSession(score);
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
      onSubmitAnswer={onSubmitAnswer}
      onEndSession={onEndSession}
      strikeCount={proctorStrikeCount}
      showWarningModal={proctorShowWarning}
      onResumeFullscreen={proctorResumeFS}
      onEliminate={onEliminate}
      proctoringClient={proctoringClient}
    />
  );
}
