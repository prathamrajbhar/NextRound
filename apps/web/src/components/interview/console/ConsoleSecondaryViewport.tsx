'use client';

import React from 'react';
import { FileText, CheckCircle2, XCircle, Save, VideoOff, User, Mic, MicOff } from '@/lib/lucide-google-icons';
import { InterviewConsoleMode } from './types';

interface ConsoleSecondaryViewportProps {
  mode: InterviewConsoleMode;
  candidateName: string;
  camActive: boolean;
  micActive?: boolean;
  micLevel?: number;
  hasCamPermission: boolean | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hrNotes: string;
  hrDecision: 'pass' | 'fail' | null;
  onHrNotesChange: (notes: string) => void;
  onHrDecisionChange: (decision: 'pass' | 'fail' | null) => void;
  onCompleteHRRound?: (result: 'pass' | 'fail', notes: string) => void;
}

export function ConsoleSecondaryViewport({
  mode,
  candidateName,
  camActive,
  micActive = true,
  micLevel = 20,
  hasCamPermission,
  videoRef,
  hrNotes,
  hrDecision,
  onHrNotesChange,
  onHrDecisionChange,
  onCompleteHRRound,
}: ConsoleSecondaryViewportProps) {
  return (
    <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800/90 overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col group transition-all duration-300">
      {mode === 'hr-recruiter' ? (
        <div className="p-5 flex-1 overflow-y-auto space-y-5 font-sans">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-white font-display flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-brand-400" />
              Live HR Round Evaluation Form
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Submit evaluation notes and hiring decision for candidate</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Candidate Notes &amp; Observations</label>
            <textarea
              value={hrNotes}
              onChange={(e) => onHrNotesChange(e.target.value)}
              placeholder="Record key observations, technical depth, communication clarity..."
              className="w-full h-32 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none font-sans"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider">HR Round Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onHrDecisionChange('pass')}
                className={`py-3 px-4 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  hrDecision === 'pass' ? 'bg-emerald-950 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Pass HR Round</span>
              </button>

              <button
                type="button"
                onClick={() => onHrDecisionChange('fail')}
                className={`py-3 px-4 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  hrDecision === 'fail' ? 'bg-rose-950 border-rose-500 text-rose-300 ring-2 ring-rose-500/30' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <XCircle className="h-4 w-4 text-rose-400" />
                <span>Reject Candidate</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={!hrDecision}
            onClick={() => hrDecision && onCompleteHRRound && onCompleteHRRound(hrDecision, hrNotes)}
            className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 font-display"
          >
            <Save className="h-4 w-4" />
            <span>Finalize HR Round Evaluation</span>
          </button>
        </div>
      ) : (
        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {camActive && hasCamPermission !== false ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3 text-center p-6 select-none">
              <div className="h-20 w-20 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                <VideoOff className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-300">Camera Paused</span>
                <p className="text-[10px] text-slate-500 max-w-xs">Enable camera from bottom controls to re-activate proctor video stream</p>
              </div>
            </div>
          )}

          {/* Top Badge: Candidate Name */}
          <div className="absolute top-3.5 left-3.5 px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-800/80 text-[10px] font-bold text-slate-200 flex items-center gap-2 backdrop-blur-md shadow-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <User className="h-3 w-3 text-brand-400" />
            <span>{candidateName} (You)</span>
          </div>

          {/* Bottom Overlay: Real-time User Microphone Audio Level / Equalizer */}
          <div className="absolute bottom-3.5 left-3.5 right-3.5 px-3.5 py-2 rounded-2xl bg-slate-950/85 border border-slate-800/80 backdrop-blur-md flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-xl border ${
                micActive ? 'bg-emerald-950/80 border-emerald-600/40 text-emerald-400' : 'bg-rose-950/80 border-rose-600/40 text-rose-400'
              }`}>
                {micActive ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white tracking-wide">
                  {micActive ? 'Candidate Audio' : 'Microphone Muted'}
                </span>
                <span className="text-[8px] text-slate-400 font-medium">
                  {micActive ? (micLevel > 20 ? 'Active Speaking Detected' : 'Listening for Speech...') : 'Mic Inactive'}
                </span>
              </div>
            </div>

            {/* Live Mic Amplitude Equalizer Bars */}
            <div className="flex items-center gap-1 h-5 px-2 py-1 rounded-xl bg-slate-900/90 border border-slate-800">
              {[25, 45, 75, 95, 80, 60, 40, 90, 65, 30].map((baseHeight, idx) => {
                const computedHeight = micActive ? Math.min(100, Math.max(15, (baseHeight * micLevel) / 100)) : 10;
                return (
                  <span
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      !micActive
                        ? 'bg-slate-700'
                        : micLevel > 25
                        ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                        : 'bg-slate-600'
                    }`}
                    style={{ height: `${computedHeight}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
