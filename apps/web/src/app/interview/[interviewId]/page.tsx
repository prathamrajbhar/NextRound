'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Application } from '@/types';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import InterviewCheckScreen from '@/components/interview/InterviewCheckScreen';
import UnifiedInterviewConsole from '@/components/interview/UnifiedInterviewConsole';

export default function LiveInterviewRoom({ params }: { params: Promise<{ interviewId: string }> }) {
  const router = useRouter();
  const { interviewId } = use(params);
  const [app, setApp] = useState<Application | null>(null);
  const [loadError, setLoadError] = useState(false);

  const companyName = app?.orgName || 'Interview';
  const jobTitle = app?.jobTitle || 'Candidate Interview';

  useEffect(() => {
    async function fetchApp() {
      try {
        const res = await apiClient.get<Application>(`/applications/${interviewId}`);
        if (res) {
          setApp(res);
        } else {
          setLoadError(true);
        }
      } catch (err) {
        console.error('Failed to load application details:', err);
        setLoadError(true);
      }
    }
    fetchApp();
  }, [interviewId]);

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
  } = useInterviewSession({
    company: companyName,
    role: jobTitle,
    difficulty: 'mid',
    interviewId,
    storageKey: `candidateInterview_${interviewId}`,
    onComplete: () => {
      router.push(`/candidate/applications/${interviewId}`);
    },
  });

  if (loadError) {
    return (
      <div className="h-screen w-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-3">
          <h1 className="text-lg font-extrabold text-white font-display">Interview Not Found</h1>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            We couldn&apos;t load this interview. Please go back and try again.
          </p>
          <button
            type="button"
            onClick={() => router.push('/candidate/dashboard')}
            className="mt-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold transition-all cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="h-screen w-screen bg-slate-950 text-white flex items-center justify-center text-xs font-bold">
        Loading interview room...
      </div>
    );
  }

  if (stage === 'check') {
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
      onEndSession={wrapUp}
    />
  );
}
