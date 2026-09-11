'use client';

import React from 'react';
import { MessageSquare, CheckCircle2, Target } from '@/lib/lucide-google-icons';

interface FeedbackSummaryCardProps {
  feedback: string;
  strengths: string[];
  growthAreas: string[];
}

export function FeedbackSummaryCard({
  feedback,
  strengths,
  growthAreas,
}: FeedbackSummaryCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
          <MessageSquare className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
          Executive Assessment Summary
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60 uppercase">
          Evaluator Verified
        </span>
      </div>

      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold italic border-l-4 border-brand-500 dark:border-orange-400 pl-4 py-3 bg-slate-50/60 dark:bg-slate-800/40 rounded-r-2xl">
        &ldquo;{feedback}&rdquo;
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Key Strengths
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
            {strengths.length > 0 ? (
              strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span>{s}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 dark:text-slate-500 text-xs italic">
                No specific strengths recorded for this session.
              </li>
            )}
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
            <Target className="h-4 w-4 text-amber-500" /> Focus Areas for Growth
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
            {growthAreas.length > 0 ? (
              growthAreas.map((g, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span>{g}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 dark:text-slate-500 text-xs italic">
                No specific growth areas recorded for this session.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
