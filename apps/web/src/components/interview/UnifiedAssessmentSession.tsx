'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { MockSession, Application } from '@/types';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import InterviewCheckScreen from '@/components/interview/InterviewCheckScreen';
import UnifiedInterviewConsole from '@/components/interview/UnifiedInterviewConsole';
import AptitudeTestConsole from '@/components/interview/AptitudeTestConsole';
import CodingAssessmentConsole from '@/components/interview/CodingAssessmentConsole';
import { CompanyLogo } from '@/components/ui';
import { CheckCircle2, ArrowRight, Maximize2 } from '@/lib/lucide-google-icons';

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
  const router = useRouter();

  const [session, setSession] = useState<Partial<MockSession>>({
    id: sessionId,
    targetCompany: company || '',
    targetRole: role || '',
    difficulty: 'senior',
  });
  const [app, setApp] = useState<Partial<Application> | null>(null);

  const [comprehensiveStep, setComprehensiveStep] = useState<'aptitude' | 'coding' | 'technical'>('aptitude');
  const [pendingNextRound, setPendingNextRound] = useState<InterRoundData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const isJobAptitudeSession = sessionId.startsWith('session-');
        if (!isJobAptitudeSession && sessionId !== 'new' && sessionId !== 'practice') {
          const res = await apiClient.get<{ session: MockSession }>(`/mock/sessions/${sessionId}`).catch(() => null);
          if (res?.session) setSession(res.session);
        }
        if (applicationId) {
          const resApp = await apiClient.get<Application>(`/applications/${applicationId}`).catch(() => null);
          if (resApp) setApp(resApp);
        }
      } catch (err) {
        console.error('Failed to load session details:', err);
      }
    }
    fetchData();
  }, [sessionId, applicationId]);

  const targetCompany = app?.orgName || session.targetCompany || company || '';
  const targetRole = app?.jobTitle || session.targetRole || role || '';

  const handleComplete = async (score?: number) => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {}

    try {
      if (sessionId && sessionId !== 'new' && sessionId !== 'practice') {
        await apiClient.post(`/mock/sessions/${sessionId}/end`, {
          score,
          transcript: messages.map((m) => ({
            role: m.role === 'candidate' ? 'candidate' : 'interviewer',
            text: m.content,
            timestamp: m.timestamp,
          })),
        }).catch(() => null);
      }
    } catch (err) {
      console.error('Error ending mock session:', err);
    }
    if (applicationId) {
      localStorage.setItem(`candidateAssessmentCompleted_${applicationId}`, 'true');
      const scoreObj = {
        overallScore: score ?? 0,
        completedDate: new Date().toISOString().slice(0, 10),
      };
      localStorage.setItem(`assessmentResult_${applicationId}`, JSON.stringify(scoreObj));
      router.push(`/candidate/applications/${applicationId}`);
    } else {
      router.push(`/candidate/mock/${sessionId}/feedback`);
    }
  };

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
  } = useInterviewSession({
    company: targetCompany,
    role: targetRole,
    difficulty: session.difficulty || 'senior',
    storageKey: `mockSession_${sessionId}`,
    onComplete: () => handleComplete(),
  });

  const activeRoundTrack = track === 'comprehensive' ? comprehensiveStep : track;

  const handleLaunchNextRound = () => {
    if (!pendingNextRound) return;
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}

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
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-6 animate-in fade-in duration-200 font-sans transition-colors duration-300">
        <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center backdrop-blur-md">
          <div className="space-y-2">
            <CompanyLogo name={targetCompany} size="lg" className="mx-auto shadow-md" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white font-display pt-1">{targetCompany}</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{targetRole}</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-slate-950 border border-emerald-200 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Stage {pendingNextRound.stageNumber} Completed
            </span>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              {pendingNextRound.completedStageName}
            </h3>
            <span className="text-xl font-black text-brand-600 dark:text-amber-400 block pt-1">
              Score: {pendingNextRound.completedScore}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1 text-left">
            <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
              Up Next: Stage {pendingNextRound.stageNumber + 1}
            </span>
            <h4 className="text-xs font-black text-amber-900 dark:text-amber-200">{pendingNextRound.nextStageName}</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium pt-0.5">
              Ready to enter full-screen proctored environment for the next round.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLaunchNextRound}
            className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Maximize2 className="h-4 w-4" />
            <span>Start Stage {pendingNextRound.stageNumber + 1}: {pendingNextRound.nextStageName}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (activeRoundTrack === 'aptitude') {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto p-2 sm:p-4 flex flex-col space-y-2 animate-in fade-in duration-300 transition-colors duration-300">
        <div className="flex-1">
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
        </div>
      </div>
    );
  }

  if (activeRoundTrack === 'coding') {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto p-2 sm:p-4 flex flex-col space-y-2 animate-in fade-in duration-300 transition-colors duration-300">
        <div className="flex-1">
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
        </div>
      </div>
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
    />
  );
}
