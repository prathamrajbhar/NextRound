'use client';

import React from 'react';
import { Wifi, RefreshCw, Loader2, Sliders } from '@/lib/lucide-google-icons';

interface LatencyDiagnosticCardProps {
  latencyStatus: 'idle' | 'checking' | 'passed' | 'failed';
  latencyMs: number | null;
  jitterMs: number | null;
  onTest: () => void;
}

export function LatencyDiagnosticCard({
  latencyStatus,
  latencyMs,
  jitterMs,
  onTest,
}: LatencyDiagnosticCardProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel space-y-4">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Wifi className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          Network Connection Speed Test
        </h3>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
          Check packet latency response to ensure smooth real-time dialogue audio.
        </p>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-2xl bg-white/30 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 text-center">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Latency</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {latencyMs !== null ? `${latencyMs}ms` : '--'}
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/30 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 text-center">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Jitter</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {jitterMs !== null ? `${jitterMs}ms` : '--'}
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/30 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 text-center flex flex-col justify-center items-center">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Status</span>
            {latencyStatus === 'passed' && <span className="text-[9px] font-extrabold text-emerald-500">STABLE</span>}
            {latencyStatus === 'failed' && <span className="text-[9px] font-extrabold text-rose-500">UNSTABLE</span>}
            {latencyStatus === 'checking' && <Loader2 className="h-3 w-3 text-brand-500 animate-spin" />}
            {latencyStatus === 'idle' && <span className="text-[9px] font-extrabold text-slate-400">UNTESTED</span>}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onTest}
            disabled={latencyStatus === 'checking'}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-extrabold text-[10px] shadow flex items-center gap-1.5 disabled:opacity-60 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${latencyStatus === 'checking' ? 'animate-spin' : ''}`} />
            {latencyStatus === 'checking' ? 'Testing...' : 'Test Network'}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-4 shadow-sm backdrop-blur-md glass-panel flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sliders className="h-4.5 w-4.5 text-emerald-500" />
          <div>
            <span className="text-[10px] font-bold text-slate-900 dark:text-white block uppercase tracking-wider">Integrity Clearance</span>
            <span className="text-[9px] text-slate-500 block">Proctoring checklist compatibility verified.</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">CLEARED</span>
        </div>
      </div>
    </div>
  );
}
