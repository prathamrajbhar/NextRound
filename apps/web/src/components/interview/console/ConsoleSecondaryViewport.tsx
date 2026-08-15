'use client';

import React from 'react';
import { FileText, CheckCircle2, XCircle, Save, VideoOff, User } from '@/lib/lucide-google-icons';
import { InterviewConsoleMode } from './types';

interface ConsoleSecondaryViewportProps {
  mode: InterviewConsoleMode;
  candidateName: string;
  camActive: boolean;
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
  hasCamPermission,
  videoRef,
  hrNotes,
  hrDecision,
  onHrNotesChange,
  onHrDecisionChange,
  onCompleteHRRound,
}: ConsoleSecondaryViewportProps) {
  return (
    <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-md flex flex-col">
      {mode === 'hr-recruiter' ? (
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-sans">
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
            <div className="flex flex-col items-center justify-center space-y-2 text-center p-6">
              <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <VideoOff className="h-8 w-8" />
              </div>
              <span className="text-xs font-extrabold text-slate-400">Camera Off</span>
            </div>
          )}

          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800/80 text-[10px] font-extrabold text-slate-300 flex items-center gap-1.5 backdrop-blur-md">
            <User className="h-3 w-3 text-brand-400" />
            <span>{candidateName} (You)</span>
          </div>
        </div>
      )}
    </div>
  );
}
