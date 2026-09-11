'use client';

import React from 'react';
import { Monitor, CheckCircle2, XCircle, Loader2 } from '@/lib/lucide-google-icons';

interface ScreenShareDiagnosticCardProps {
  screenShareVerified: 'idle' | 'checking' | 'verified' | 'failed';
  screenShareError: string;
  onTest: () => void;
}

export function ScreenShareDiagnosticCard({
  screenShareVerified,
  screenShareError,
  onTest,
}: ScreenShareDiagnosticCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel space-y-4">
      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 flex items-center gap-2">
        <Monitor className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
        Screen Share Integrity Check
      </h3>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
        Proctored rounds require active screen sharing. Verify that your system allows sharing authorization.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onTest}
          disabled={screenShareVerified === 'checking'}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-extrabold text-xs shadow-md disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {screenShareVerified === 'checking' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
            </>
          ) : (
            'Test Screen Share'
          )}
        </button>

        <div className="flex-grow flex items-center justify-center sm:justify-start">
          {screenShareVerified === 'verified' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider animate-in zoom-in-95">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified
            </div>
          )}
          {screenShareVerified === 'failed' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider animate-in zoom-in-95">
              <XCircle className="h-3.5 w-3.5" />
              Failed
            </div>
          )}
          {screenShareVerified === 'idle' && (
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Verification Needed
            </div>
          )}
        </div>
      </div>

      {screenShareError && (
        <p className="text-[10px] text-rose-500 font-semibold bg-rose-500/5 p-2 rounded-xl border border-rose-500/10">
          ⚠️ {screenShareError}
        </p>
      )}
    </div>
  );
}
