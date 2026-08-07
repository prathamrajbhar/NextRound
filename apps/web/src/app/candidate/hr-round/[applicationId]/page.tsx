'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Application } from '@/types';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import InterviewActiveConsole from '@/components/interview/InterviewActiveConsole';
import {
  Mic,
  MicOff,
  VideoOff,
  CheckCircle2,
  ArrowLeft,
  Video as VideoIcon,
  UserCheck,
} from '@/lib/lucide-google-icons';

export default function CandidateHrRoundRoom({ params }: { params: Promise<{ applicationId: string }> }) {
  const router = useRouter();
  const { applicationId } = use(params);

  const [app, setApp] = useState<Application | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    async function fetchApp() {
      try {
        const res = await apiClient.get<Application>(`/applications/${applicationId}`);
        if (res) {
          setApp(res);
        } else {
          setApp({
            id: applicationId,
            candidateName: 'Candidate User',
            candidateEmail: 'candidate@example.com',
            candidateAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
            jobId: 'job-101',
            jobTitle: 'Senior Full Stack Engineer',
            orgName: 'Swiggy',
            status: 'hr_round',
            stage: 'HR Round',
            appliedDate: new Date().toISOString(),
            resumeUrl: '',
            skills: ['React', 'Node.js', 'TypeScript'],
            targetRoles: ['Full Stack Engineer'],
          });
        }
      } catch (err) {
        console.error('Failed to load application:', err);
      }
    }
    fetchApp();
  }, [applicationId]);

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
    difficulty: 'senior',
    interviewId: applicationId,
    storageKey: `candidateHrRound_${applicationId}`,
    onComplete: () => {
      if (app) {
        router.push(`/candidate/applications/${app.id}`);
      } else {
        router.push('/candidate/dashboard');
      }
    },
  });

  const handleJoinCall = () => {
    startSession();
    setJoined(true);
  };

  if (!app) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-bold">
        Loading HR Round Room...
      </div>
    );
  }

  // Pre-call Waiting Room View
  if (!joined) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans p-6 items-center justify-center overflow-y-auto">
        <div className="max-w-xl w-full space-y-6 animate-in fade-in duration-300">
          {/* Back Navigation */}
          <Link
            href={`/candidate/applications/${app.id}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Application Detail</span>
          </Link>

          {/* Header Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center space-y-4 backdrop-blur-md shadow-2xl">
            <div className="h-16 w-16 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center mx-auto text-brand-400 shadow-md">
              <UserCheck className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-400">
                Final Step • Live Studio Interview
              </span>
              <h1 className="text-2xl font-extrabold text-white font-display">
                Human HR Round Waiting Room
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {app.jobTitle} at <span className="text-brand-400 font-bold">{app.orgName}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2 text-left">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="h-4 w-4" />
                <span>All Vetting Stages Completed</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Your HR representative and evaluation AI are ready to start your live studio video call.
              </p>
            </div>

            {/* Hardware Pre-Check Box */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Hardware Device Pre-Check
              </span>

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    micActive ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  <span>{micActive ? 'Microphone Active' : 'Mic Muted'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleCam}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    camActive ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {camActive ? <VideoIcon className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  <span>{camActive ? 'Camera Active' : 'Camera Off'}</span>
                </button>
              </div>
            </div>

            {/* Join Call CTA Button */}
            <button
              type="button"
              onClick={handleJoinCall}
              className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <VideoIcon className="h-5 w-5" />
              <span>Join Studio Video Call</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Studio Video Call Room View (using real InterviewActiveConsole)
  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-white flex flex-col justify-between overflow-hidden p-2">
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

