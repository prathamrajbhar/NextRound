'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { mockApplications, Application } from '@/lib/mockData';
import {
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Video as VideoIcon,
  UserCheck,
} from '@/lib/lucide-google-icons';

export default function CandidateHrRoundRoom({ params }: { params: Promise<{ applicationId: string }> }) {
  const router = useRouter();
  const { applicationId } = use(params);

  const [app] = useState<Application>(
    () => mockApplications.find((a) => a.id === applicationId) || mockApplications[0]
  );
  const [joined, setJoined] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  // Call timer effect when joined
  useEffect(() => {
    if (!joined) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [joined]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeaveCall = () => {
    setJoined(false);
    if (app) {
      router.push(`/candidate/applications/${app.id}`);
    }
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
                Final Step • Live 1:1 Call
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
                <span>All AI Vetting Stages Completed</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                You have passed all AI-driven assessments. Your HR representative is ready to start your 1:1 video call.
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
                  onClick={() => setMicActive(!micActive)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    micActive ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  <span>{micActive ? 'Microphone Active' : 'Mic Muted'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCamActive(!camActive)}
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
              onClick={() => setJoined(true)}
              className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <VideoIcon className="h-5 w-5" />
              <span>Join Live HR Video Call</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Live Video Call Room View
  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Call Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <div>
            <h1 className="text-sm font-extrabold text-white font-display">
              Live HR 1:1 Video Call — {app.orgName}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">{app.jobTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700 text-xs font-mono font-bold text-slate-300">
            <Clock className="h-3.5 w-3.5 text-brand-400" />
            <span>{formatDuration(callDuration)}</span>
          </div>

          <button
            type="button"
            onClick={handleLeaveCall}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <PhoneOff className="h-4 w-4" />
            <span>Leave Call</span>
          </button>
        </div>
      </header>

      {/* Main Video Grid Viewport */}
      <div className="flex-1 p-6 relative flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl flex-1 relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex items-center justify-center min-h-[480px]">
          {/* Main HR Representative Simulated Video Feed */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-10"></div>
          
          <div className="relative z-10 text-center space-y-4 max-w-md p-6">
            <div className="h-20 w-20 rounded-full bg-brand-500/20 border-2 border-brand-400 flex items-center justify-center mx-auto text-brand-400 font-bold text-2xl shadow-xl">
              HR
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white font-display">
                HR Representative ({app.orgName})
              </h3>
              <span className="text-xs text-emerald-400 font-bold block">
                Connected • High Definition WebRTC Stream
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Live human interview in progress. Your HR manager is evaluating cultural fit and answering your candidate questions.
            </p>
          </div>

          {/* Candidate Self Video PIP Box */}
          <div className="absolute bottom-4 right-4 z-20 w-48 h-36 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-2xl">
            {camActive ? (
              <Image
                src={app.candidateAvatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300'}
                alt="Your Preview"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-500 gap-1">
                <VideoOff className="h-6 w-6" />
                <span className="text-[10px] font-bold">Your Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 z-10 bg-slate-950/80 px-2 py-0.5 rounded text-[9px] font-bold text-slate-300">
              You
            </div>
          </div>

          {/* Floating Controls Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-6 py-3 rounded-full border border-slate-800 shadow-2xl">
            <button
              type="button"
              onClick={() => setMicActive(!micActive)}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                micActive ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-red-600 text-white'
              }`}
            >
              {micActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={() => setCamActive(!camActive)}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                camActive ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-red-600 text-white'
              }`}
            >
              {camActive ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            <div className="h-6 w-px bg-slate-800 mx-2"></div>

            <button
              type="button"
              onClick={handleLeaveCall}
              className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Leave Call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
