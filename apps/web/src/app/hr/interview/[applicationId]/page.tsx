'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { mockApplications, Application } from '@/lib/mockData';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  Award,
  ArrowLeft,
} from '@/lib/lucide-google-icons';

export default function HrVideoCallConsole({ params }: { params: Promise<{ applicationId: string }> }) {
  const router = useRouter();
  const { applicationId } = use(params);

  const [app] = useState<Application>(
    () => mockApplications.find((a) => a.id === applicationId) || mockApplications[0]
  );
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callEnded, setCallEnded] = useState(false);
  const [selectedResult, setSelectedResult] = useState<'pass' | 'fail' | null>(null);
  const [notes, setNotes] = useState('');

  // Call timer effect
  useEffect(() => {
    if (callEnded) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callEnded]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallEnded(true);
  };

  const handleCompleteHRRound = (result: 'pass' | 'fail') => {
    setSelectedResult(result);
    
    // Persist HR round outcome to localStorage mock state
    if (app) {
      const updatedApp = {
        ...app,
        stage: 'Decision' as const,
        status: 'decided' as const,
        hrRoundStatus: result === 'pass' ? ('PASSED' as const) : ('FAILED' as const),
        hrRoundCompletedAt: new Date().toISOString(),
        decision: result === 'pass' ? ('hire' as const) : ('reject' as const),
        reasoning: `Human HR Round completed. Result: ${result.toUpperCase()}. Notes: "${notes || 'Completed 1:1 human video call evaluation.'}"`,
      };
      
      localStorage.setItem(`hrRoundResult_${app.id}`, JSON.stringify(updatedApp));
    }

    setTimeout(() => {
      router.push(`/hr/candidates/${applicationId}`);
    }, 1200);
  };

  if (!app) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-bold">
        Loading HR Video Console...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Header Navigation */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link
            href={`/hr/candidates/${app.id}`}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-sm font-extrabold text-white font-display">
                Human HR Round — Live 1:1 Video Call
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 uppercase">
                Zero AI Participant
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Candidate: <span className="text-slate-200 font-bold">{app.candidateName}</span> • Position: {app.jobTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700 text-xs font-mono font-bold text-slate-300">
            <Clock className="h-3.5 w-3.5 text-brand-400" />
            <span>{formatDuration(callDuration)}</span>
          </div>

          <button
            type="button"
            onClick={handleEndCall}
            disabled={callEnded}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <PhoneOff className="h-4 w-4" />
            <span>{callEnded ? 'Call Ended' : 'End Call'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-hidden">
        {/* Left Column (2 Cols): WebRTC Video Feeds */}
        <div className="lg:col-span-2 flex flex-col gap-4 relative h-full">
          {/* Primary Main Candidate Video Feed Container */}
          <div className="flex-1 relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex items-center justify-center group min-h-[420px]">
            {/* Candidate Stream Simulated Viewport */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-10"></div>
            
            <Image
              src={app.candidateAvatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800'}
              alt={app.candidateName}
              fill
              className="object-cover opacity-85 filter contrast-105"
              unoptimized
            />

            {/* Candidate Label Tag */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-xs font-bold text-slate-200">
              <User className="h-3.5 w-3.5 text-emerald-400" />
              <span>{app.candidateName} (Candidate)</span>
            </div>

            {/* WebRTC Live Audio Indicator */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>WebRTC Audio Connected</span>
            </div>

            {/* HR Self-Preview PIP Box */}
            <div className="absolute bottom-4 right-4 z-20 w-44 h-32 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-xl relative group/pip">
              {camActive ? (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-slate-950"></div>
                  <div className="z-10 text-center space-y-1">
                    <div className="h-10 w-10 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center mx-auto text-brand-400 font-bold text-sm">
                      HR
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-300 block">You (HR Host)</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-500 gap-1">
                  <VideoOff className="h-5 w-5" />
                  <span className="text-[9px] font-bold">Camera Off</span>
                </div>
              )}
            </div>

            {/* Bottom Floating Control Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-800 shadow-2xl">
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
                {camActive ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>

              <div className="h-6 w-px bg-slate-800 mx-1"></div>

              <button
                type="button"
                onClick={handleEndCall}
                disabled={callEnded}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                <PhoneOff className="h-4 w-4" />
                <span>End Call</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): HR Evaluation Panel & Pass/Fail Action */}
        <div className="space-y-5 flex flex-col h-full overflow-y-auto pr-1">
          {/* Candidate Dossier Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-display flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-400" />
                Candidate Dossier
              </h3>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                AI Score: {app.scores?.composite || 86}%
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Position</span>
                <span className="font-extrabold text-slate-200">{app.jobTitle}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Verified Skills</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {app.skills?.slice(0, 5).map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-brand-400 uppercase block">AI Evaluator Summary</span>
                <p className="text-[11px] text-slate-400 italic leading-relaxed font-medium">
                  &ldquo;{app.reasoning}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* HR Decision Action Box */}
          <div className="rounded-3xl border border-brand-500/30 bg-gradient-to-b from-brand-950/30 via-slate-900 to-slate-950 p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Award className="h-4.5 w-4.5 text-brand-400" />
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-display">
                HR Round Evaluation
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              After concluding your 1:1 call with <span className="text-slate-200 font-bold">{app.candidateName}</span>, manually mark the round outcome. Passing triggers the Decision Agent to dispatch the offer letter.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Evaluation Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes regarding culture fit, communication, or salary alignment..."
                className="w-full h-20 bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500 resize-none font-sans"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleCompleteHRRound('pass')}
                disabled={selectedResult !== null}
                className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:scale-[1.02]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Mark as Pass</span>
              </button>

              <button
                type="button"
                onClick={() => handleCompleteHRRound('fail')}
                disabled={selectedResult !== null}
                className="py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:scale-[1.02]"
              >
                <XCircle className="h-4 w-4" />
                <span>Mark as Fail</span>
              </button>
            </div>

            {selectedResult && (
              <div className={`p-3 rounded-2xl border text-xs font-bold text-center animate-in fade-in duration-200 ${
                selectedResult === 'pass' 
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' 
                  : 'bg-red-950/80 border-red-800 text-red-300'
              }`}>
                {selectedResult === 'pass' 
                  ? '✓ HR Round PASSED. Decision Agent triggering offer letter...' 
                  : '✗ HR Round FAILED. Rejection notice queued.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
