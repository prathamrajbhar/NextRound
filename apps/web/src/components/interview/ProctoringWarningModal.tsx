'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, Maximize2, XCircle } from '@/lib/lucide-google-icons';

interface ProctoringWarningModalProps {
  isOpen: boolean;
  strikeCount: number;
  maxStrikes?: number;
  onResumeFullscreen: () => void;
  onEliminate?: () => void;
}

export function ProctoringWarningModal({
  isOpen,
  strikeCount,
  maxStrikes = 3,
  onResumeFullscreen,
  onEliminate,
}: ProctoringWarningModalProps) {
  if (!isOpen) return null;

  const isEliminated = strikeCount >= maxStrikes;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans">
      <div className={`w-full max-w-lg p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 text-center ${
        isEliminated
          ? 'bg-rose-950/90 border-rose-800 text-rose-100 ring-2 ring-rose-500/50'
          : 'bg-slate-900 border-amber-500/40 text-slate-100 ring-2 ring-amber-500/30'
      }`}>
        
        {/* Warning Icon Badge */}
        <div className="mx-auto h-16 w-16 rounded-3xl flex items-center justify-center shadow-lg border animate-bounce" style={{
          backgroundColor: isEliminated ? 'rgba(225, 29, 72, 0.2)' : 'rgba(245, 158, 11, 0.2)',
          borderColor: isEliminated ? 'rgba(225, 29, 72, 0.6)' : 'rgba(245, 158, 11, 0.6)',
        }}>
          {isEliminated ? (
            <XCircle className="h-9 w-9 text-rose-500" />
          ) : (
            <AlertTriangle className="h-9 w-9 text-amber-500" />
          )}
        </div>

        {/* Modal Header Title */}
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-black/40" style={{
            color: isEliminated ? '#fecdd3' : '#fef3c7',
            borderColor: isEliminated ? 'rgba(225,29,72,0.4)' : 'rgba(245,158,11,0.4)',
          }}>
            {isEliminated ? '❌ CANDIDATE ELIMINATED' : '⚠️ PROCTORING VIOLATION DETECTED'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight font-display pt-2">
            {isEliminated ? 'Assessment Terminated' : 'Fullscreen Exit Detected'}
          </h2>
          <p className="text-xs text-slate-300 font-semibold max-w-md mx-auto leading-relaxed pt-1">
            {isEliminated
              ? 'You have exceeded the maximum allowed proctoring violations. Your practice assessment has been terminated and disqualified.'
              : 'You exited full-screen mode or switched windows during an active proctored assessment session. Please return to full screen immediately.'}
          </p>
        </div>

        {/* Strike Meter */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
          <div className="flex justify-between text-xs font-black uppercase tracking-wider">
            <span>Violation Strikes</span>
            <span className={isEliminated ? 'text-rose-400 font-mono' : 'text-amber-400 font-mono'}>
              Strike {Math.min(strikeCount, maxStrikes)} / {maxStrikes}
            </span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: maxStrikes }).map((_, idx) => {
              const isFilled = idx < strikeCount;
              return (
                <div
                  key={idx}
                  className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
                    isFilled
                      ? isEliminated
                        ? 'bg-rose-600 shadow-sm'
                        : 'bg-amber-500 shadow-sm'
                      : 'bg-slate-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Modal Action Button */}
        <div className="pt-2">
          {!isEliminated ? (
            <button
              type="button"
              onClick={onResumeFullscreen}
              className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <Maximize2 className="h-4.5 w-4.5" />
              <span>Re-enter Fullscreen &amp; Resume Test</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onEliminate}
              className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <XCircle className="h-4.5 w-4.5" />
              <span>Exit Assessment Studio</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
