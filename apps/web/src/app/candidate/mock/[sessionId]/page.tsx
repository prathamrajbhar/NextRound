'use client';

import React, { use, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function MockSessionContent({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const track = searchParams.get('track') || 'technical';
  const applicationId = searchParams.get('applicationId');

  const { sessionId } = use(params);
  const searchCompany = searchParams.get('company') || undefined;
  const searchRole = searchParams.get('role') || undefined;

  const [session, setSession] = useState<Partial<MockSession>>({
    id: sessionId,
    targetCompany: searchCompany || '',
    targetRole: searchRole || '',
    difficulty: 'senior',
  });
  const [app, setApp] = useState<Partial<Application> | null>(null);

  const [comprehensiveStep, setComprehensiveStep] = useState<'aptitude' | 'coding' | 'technical'>('aptitude');
  const [pendingNextRound, setPendingNextRound] = useState<InterRoundData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Skip DB lookup for real-job aptitude sessions (sessionId = "session-{applicationId}")
        // These have no MockSession record — the applicationId param carries all needed data.
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

  const targetCompany = app?.orgName || session.targetCompany || searchCompany || '';
  const targetRole = app?.jobTitle || session.targetRole || searchRole || '';

  const handleComplete = async (score?: number) => {
    // Exit full-screen mode to restore normal candidate layout & sidebar
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

  // Hardware Check Screen
  if (stage === 'check') {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-white overflow-y-auto">
        <InterviewCheckScreen
          company={targetCompany}
          role={targetRole}
          camActive={camActive}
          onJoin={startSession}
        />
      </div>
    );
  }

  // Inter-Round Transition Screen (Appears between rounds in multi-stage sessions)
  if (pendingNextRound) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 animate-in fade-in duration-200 font-sans">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center backdrop-blur-md">
          
          <div className="space-y-2">
            <CompanyLogo name={targetCompany} size="lg" className="mx-auto shadow-md" />
            <h2 className="text-xl font-black text-white font-display pt-1">{targetCompany}</h2>
            <p className="text-xs font-semibold text-slate-400">{targetRole}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">
              Stage {pendingNextRound.stageNumber} Completed
            </span>
            <h3 className="text-sm font-extrabold text-slate-200 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {pendingNextRound.completedStageName}
            </h3>
            <span className="text-xl font-black text-amber-400 block pt-1">
              Score: {pendingNextRound.completedScore}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-900/60 space-y-1 text-left">
            <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider block">
              Up Next: Stage {pendingNextRound.stageNumber + 1}
            </span>
            <h4 className="text-xs font-black text-amber-200">{pendingNextRound.nextStageName}</h4>
            <p className="text-[11px] text-slate-400 font-medium pt-0.5">
              Ready to enter full-screen proctored environment for the next round.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLaunchNextRound}
            className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01]"
          >
            <Maximize2 className="h-4 w-4" />
            <span>Start Stage {pendingNextRound.stageNumber + 1}: {pendingNextRound.nextStageName}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

        </div>
      </div>
    );
  }

  // Aptitude Test Console
  if (activeRoundTrack === 'aptitude') {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-white overflow-y-auto p-4 flex flex-col space-y-2">
        <div className="flex-1">
          <AptitudeTestConsole
            company={targetCompany}
            role={targetRole}
            applicationId={applicationId || undefined}
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

  // Coding Assessment Console
  if (activeRoundTrack === 'coding') {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-white overflow-y-auto p-4 flex flex-col space-y-2">
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

  // AI Voice Conversational Interview Console
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

export default function MockSessionRoom({ params }: { params: Promise<{ sessionId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 p-8">
          Loading assessment room...
        </div>
      }
    >
      <MockSessionContent params={params} />
    </Suspense>
  );
}
