'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Application } from '@/types';
import UnifiedInterviewConsole from '@/components/interview/UnifiedInterviewConsole';
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
  const [loadError, setLoadError] = useState(false);
  const [joined, setJoined] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [joinError, setJoinError] = useState<string | null>(null);

  const companyName = app?.orgName || 'Interview';
  const jobTitle = app?.jobTitle || 'Candidate Interview';

  useEffect(() => {
    async function fetchApp() {
      try {
        const res = await apiClient.get<Application>(`/applications/${applicationId}`);
        if (res) {
          setApp(res);
        } else {
          setLoadError(true);
        }
      } catch (err) {
        console.error('Failed to load application:', err);
        setLoadError(true);
      }
    }
    fetchApp();
  }, [applicationId]);

  // Call timer effect
  useEffect(() => {
    if (!joined) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [joined]);

  const toggleMic = () => setMicActive((p) => !p);
  const toggleCam = () => setCamActive((p) => !p);

  const handleJoinCall = async () => {
    setJoinError(null);
    try {
      await apiClient.post(`/interviews/${applicationId}/consent`, {
        videoConsent: camActive,
        audioConsent: micActive,
      });
      await apiClient.post(`/interviews/${applicationId}/session-token`);
      setJoined(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to join studio room.';
      setJoinError(msg);
      console.error('Failed to join HR call session:', err);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
            <VideoOff className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="text-lg font-extrabold text-white font-display">Application Not Found</h1>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            We couldn&apos;t load this application. Please go back and try again.
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-bold">
        Loading HR Round Room...
      </div>
    );
  }

  /* Pre-call Waiting Room View */
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
                Your HR representative is ready to start your live studio video call.
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

            {joinError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 font-bold text-center">
                Error: {joinError}
              </div>
            )}

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

  /* Active Studio Video Call Room View */
  return (
    <UnifiedInterviewConsole
      applicationId={applicationId}
      mode="hr-candidate"
      companyName={companyName}
      jobTitle={jobTitle}
      candidateName={app.candidateName}
      callDuration={callDuration}
      onEndSession={() => {
        router.push(`/candidate/applications/${applicationId}`);
      }}
    />
  );
}
