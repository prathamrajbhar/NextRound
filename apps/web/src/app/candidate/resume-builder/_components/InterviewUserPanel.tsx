'use client';

import React from 'react';
import { User, Mic } from '@/lib/lucide-google-icons';

interface InterviewUserPanelProps {
  micActive: boolean;
  camActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  candidateSpeechText: string;
  lastCandidateTurnContent?: string;
  isChatOpen: boolean;
}

export function InterviewUserPanel({
  micActive,
  camActive,
  videoRef,
  candidateSpeechText,
  lastCandidateTurnContent,
  isChatOpen,
}: InterviewUserPanelProps) {
  return (
    <div
      className={`${
        isChatOpen ? 'lg:col-span-4' : 'lg:col-span-6'
      } rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-5 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur-md">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              micActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
            }`}
          />
          Candidate Camera Feed
        </div>

        {micActive && (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
            <Mic className="h-3 w-3 animate-pulse" />
            <span>Mic Live</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center my-3 relative min-h-[220px]">
        {camActive ? (
          <div className="relative w-full h-full overflow-hidden rounded-2xl bg-slate-950/90 border border-white/10 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover transform -scale-x-100"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-20 w-20 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-md flex items-center justify-center text-slate-400 shadow-md">
              <User className="h-9 w-9" />
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-4 block">Camera Off</span>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 space-y-2 relative shadow-md">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <Mic className="h-3 w-3" /> Candidate Spoken Response
        </span>

        {candidateSpeechText ? (
          <p className="text-xs font-semibold text-emerald-300 leading-relaxed animate-in fade-in duration-100">
            &ldquo;{candidateSpeechText}&rdquo;
          </p>
        ) : lastCandidateTurnContent ? (
          <p className="text-xs font-semibold text-slate-200 leading-relaxed">
            &ldquo;{lastCandidateTurnContent}&rdquo;
          </p>
        ) : (
          <p className="text-xs font-medium text-slate-500 italic">
            Speak into your microphone or click the Messages button to type...
          </p>
        )}
      </div>
    </div>
  );
}
