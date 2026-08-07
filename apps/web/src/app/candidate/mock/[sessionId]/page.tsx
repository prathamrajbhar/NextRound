'use client';

import React, { use, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { MockSession, Application } from '@/types';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import InterviewCheckScreen from '@/components/interview/InterviewCheckScreen';
import InterviewActiveConsole from '@/components/interview/InterviewActiveConsole';
import AptitudeTestConsole from '@/components/interview/AptitudeTestConsole';
import CodingAssessmentConsole from '@/components/interview/CodingAssessmentConsole';

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
    targetCompany: searchCompany || 'Practice Mode',
    targetRole: searchRole || 'Software Engineer',
    difficulty: 'senior',
  });
  const [app, setApp] = useState<Partial<Application> | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (sessionId) {
          const res = await apiClient.get<{ session: MockSession }>(`/mock/sessions/${sessionId}`);
          if (res?.session) setSession(res.session);
        }
        if (applicationId) {
          const resApp = await apiClient.get<Application>(`/applications/${applicationId}`);
          if (resApp) setApp(resApp);
        }
      } catch (err) {
        console.error('Failed to load session details:', err);
      }
    }
    fetchData();
  }, [sessionId, applicationId]);

  // Resolve target company & role (supports both real candidate application and mock practice mode)
  const targetCompany = app?.orgName || session.targetCompany || searchCompany || 'Practice Mode';
  const targetRole = app?.jobTitle || session.targetRole || searchRole || 'Software Engineer';

  const handleComplete = async (score?: number) => {
    try {
      if (sessionId && sessionId !== 'mock-session-123') {
        await apiClient.post(`/mock/sessions/${sessionId}/end`, {
          transcript: messages.map((m) => ({
            role: m.role === 'candidate' ? 'candidate' : 'interviewer',
            text: m.content,
            timestamp: m.timestamp,
          })),
        });
      }
    } catch (err) {
      console.error('Error ending mock session:', err);
    }
    if (applicationId) {
      localStorage.setItem(`candidateAssessmentCompleted_${applicationId}`, 'true');
      const scoreObj = {
        overallScore: score || 91,
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
    micActive,
    camActive,
    isAnalyzing,
    isSimulating,
    startSession,
    submitAnswer,
    simulateSpeaking,
    wrapUp,
    toggleMic,
    toggleCam,
  } = useInterviewSession({
    company: targetCompany,
    role: targetRole,
    difficulty: session.difficulty || 'senior',
    storageKey: `mockSession_${sessionId}`,
    onComplete: () => handleComplete(),
  });

  const [comprehensiveStep, setComprehensiveStep] = useState<'aptitude' | 'coding' | 'technical'>('aptitude');

  // Handle Comprehensive (All-in-one) Multi-round Flow
  const activeRoundTrack = track === 'comprehensive' ? comprehensiveStep : track;

  // Hardware & Safety Check Screen (Anti-cheating proctored verification before launching any round)
  if (stage === 'check') {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-white overflow-y-auto">
        {track === 'comprehensive' && (
          <div className="bg-purple-950/80 border border-purple-800/80 text-purple-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-md m-4 mb-0">
            <span>Full Mock Interview — Stage 1 of 3: System &amp; Safety Check</span>
            <span className="text-[10px] bg-purple-900/90 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-700/60 uppercase">
              Initial Check
            </span>
          </div>
        )}
        <InterviewCheckScreen
          company={targetCompany}
          role={targetRole}
          camActive={camActive}
          onJoin={startSession}
        />
      </div>
    );
  }

  // Render Aptitude Test Console (used for both real candidate applications & mock practice)
  if (activeRoundTrack === 'aptitude') {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-white overflow-y-auto p-4 flex flex-col space-y-2">
        {track === 'comprehensive' && (
          <div className="bg-brand-950/80 border border-brand-800/80 text-brand-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-md">
            <span>Full Mock Interview — Stage 1 of 3: Aptitude &amp; Reasoning</span>
            <span className="text-[10px] bg-brand-900/90 text-brand-300 px-2.5 py-0.5 rounded-full border border-brand-700/60 uppercase">
              Next: Live Coding Round
            </span>
          </div>
        )}
        <div className="flex-1">
          <AptitudeTestConsole
            company={targetCompany}
            role={targetRole}
            onComplete={(score) => {
              if (track === 'comprehensive') {
                setComprehensiveStep('coding');
              } else {
                handleComplete(score);
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Render Coding Assessment Console (used for both real candidate applications & mock practice)
  if (activeRoundTrack === 'coding') {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-white overflow-y-auto p-4 flex flex-col space-y-2">
        {track === 'comprehensive' && (
          <div className="bg-amber-950/80 border border-amber-800/80 text-amber-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-md">
            <span>Full Mock Interview — Stage 2 of 3: Live Coding Round</span>
            <span className="text-[10px] bg-amber-900/90 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-700/60 uppercase">
              Next: Technical Voice AI
            </span>
          </div>
        )}
        <div className="flex-1">
          <CodingAssessmentConsole
            company={targetCompany}
            role={targetRole}
            onComplete={(score) => {
              if (track === 'comprehensive') {
                setComprehensiveStep('technical');
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
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-white flex flex-col justify-between overflow-hidden p-2">
      {track === 'comprehensive' && (
        <div className="bg-purple-950/80 border border-purple-800/80 text-purple-200 px-4 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-md mb-1">
          <span>Full Mock Interview — Stage 3 of 3: Technical Voice AI</span>
          <span className="text-[10px] bg-purple-900/90 text-purple-300 px-2 py-0.5 rounded-full border border-purple-700/60 uppercase">
            Final Round
          </span>
        </div>
      )}
      <InterviewActiveConsole
        messages={messages}
        phase={phase}
        timeRemaining={timeRemaining}
        micActive={micActive}
        camActive={camActive}
        isAnalyzing={isAnalyzing}
        isSimulating={isSimulating}
        isDarkTheme={true}
        onSubmitAnswer={submitAnswer}
        onSimulateSpeaking={simulateSpeaking}
        onEndSession={wrapUp}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        company={targetCompany}
        role={targetRole}
      />
    </div>
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
