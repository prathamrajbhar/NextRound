'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Application } from '@/types';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import InterviewCheckScreen from '@/components/interview/InterviewCheckScreen';
import InterviewActiveConsole from '@/components/interview/InterviewActiveConsole';

export default function LiveInterviewRoom({ params }: { params: Promise<{ interviewId: string }> }) {
  const router = useRouter();
  const { interviewId } = use(params);
  const [app, setApp] = useState<Application | null>(null);

  useEffect(() => {
    async function fetchApp() {
      try {
        const res = await apiClient.get<Application>(`/applications/${interviewId}`);
        if (res) {
          setApp(res);
        } else {
          setApp({
            id: interviewId,
            candidateName: 'Candidate User',
            candidateEmail: 'candidate@example.com',
            candidateAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
            jobId: 'job-101',
            jobTitle: 'Senior Full Stack Engineer',
            orgName: 'Swiggy',
            status: 'interviewed',
            stage: 'Interview',
            appliedDate: new Date().toISOString(),
            resumeUrl: '',
            skills: ['React', 'Node.js', 'TypeScript'],
            targetRoles: ['Full Stack Engineer'],
          });
        }
      } catch (err) {
        console.error('Failed to load application details:', err);
      }
    }
    fetchApp();
  }, [interviewId]);

  const companyName = app?.orgName || 'Swiggy';
  const jobTitle = app?.jobTitle || 'Senior Full Stack Engineer';

  const {
    stage,
    phase,
    messages,
    timeRemaining,
    micActive,
    camActive,
    isAnalyzing,
    isSimulating,
    proctorTelemetry,
    startSession,
    submitAnswer,
    simulateSpeaking,
    wrapUp,
    toggleMic,
    toggleCam,
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
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col justify-between overflow-hidden p-2">
      <InterviewActiveConsole
        messages={messages}
        phase={phase}
        timeRemaining={timeRemaining}
        micActive={micActive}
        camActive={camActive}
        isAnalyzing={isAnalyzing}
        isSimulating={isSimulating}
        proctorTelemetry={proctorTelemetry}
        isDarkTheme={true}
        onSubmitAnswer={submitAnswer}
        onSimulateSpeaking={simulateSpeaking}
        onEndSession={wrapUp}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        company={companyName}
        role={jobTitle}
      />
    </div>
  );
}
