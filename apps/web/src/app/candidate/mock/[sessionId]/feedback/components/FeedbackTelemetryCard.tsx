'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, ShieldCheck, Zap, Mic, Compass, LayoutDashboard } from '@/lib/lucide-google-icons';

interface FeedbackTelemetryCardProps {
  telemetry?: {
    gazeFocusPercent?: number;
    speechWpm?: number;
    verified?: boolean;
  };
}

export function FeedbackTelemetryCard({ telemetry }: FeedbackTelemetryCardProps) {
  return (
    <div className="lg:col-span-4 space-y-6">
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
            <Eye className="h-4 w-4 text-indigo-500" />
            Gaze &amp; Biometric Telemetry
          </h3>
          <span
            className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${
              telemetry?.verified
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-900/60'
                : 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            {telemetry?.verified ? 'Verified' : 'Pending Verification'}
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Screen Gaze Focus
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
                {telemetry?.gazeFocusPercent && telemetry.gazeFocusPercent > 0
                  ? `${telemetry.gazeFocusPercent}% Direct Contact`
                  : 'No Video Stream'}
              </span>
            </div>
            <ShieldCheck
              className={`h-5 w-5 ${telemetry?.gazeFocusPercent ? 'text-emerald-500' : 'text-slate-400'}`}
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Speech Pacing
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
                {telemetry?.speechWpm && telemetry.speechWpm > 0
                  ? `${telemetry.speechWpm} WPM (${
                      telemetry.speechWpm >= 110 && telemetry.speechWpm <= 160 ? 'Optimal' : 'Measured'
                    })`
                  : '0 WPM (No Speech Recorded)'}
              </span>
            </div>
            <Zap
              className={`h-5 w-5 ${telemetry?.speechWpm ? 'text-amber-500' : 'text-slate-400'}`}
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel space-y-3">
        <Link
          href="/candidate/mock/new"
          className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold py-3.5 text-xs transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          <Mic className="h-4 w-4" />
          <span>Practice Another Company</span>
        </Link>

        <Link
          href="/candidate/jobs"
          className="w-full flex items-center justify-center gap-2 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-extrabold py-3 text-xs shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <Compass className="h-4 w-4 text-slate-400" />
          <span>Browse Open Jobs</span>
        </Link>

        <Link
          href="/candidate/dashboard"
          className="w-full flex items-center justify-center gap-2 rounded-full bg-slate-100/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-200/40 dark:border-slate-700/60 font-bold py-3 text-xs shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <LayoutDashboard className="h-4 w-4 text-slate-400" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
