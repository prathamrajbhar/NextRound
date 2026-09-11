'use client';

import React from 'react';
import { Sparkles, ShieldCheck, Award } from '@/lib/lucide-google-icons';

interface MockSetupHeaderProps {
  latestScore: number | null;
}

export function MockSetupHeader({ latestScore }: MockSetupHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider text-brand-600 dark:text-orange-400 bg-brand-50 dark:bg-orange-950/80 border border-brand-200/60 dark:border-orange-900/60 uppercase mb-1.5">
          <Sparkles className="h-3 w-3 text-brand-500 dark:text-orange-400" />
          <span>AI PRACTICE ARENA • REAL-TIME INTERVIEW SIMULATOR</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
          Configure Practice Session
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Tailor company rubrics, assessment round focus, and verify hardware feed before entering the arena.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="px-3.5 py-2 rounded-2xl bg-white/60 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-md glass-panel flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>
            AI Engine: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">Active</strong>
          </span>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-white/60 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-md glass-panel flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm">
          <Award className="h-4 w-4 text-amber-500" />
          <span>
            Latest Practice:{' '}
            <strong className="text-amber-600 dark:text-amber-400 font-extrabold">
              {latestScore !== null ? `${latestScore}% Score` : 'No sessions yet'}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
