'use client';

import React, { useState } from 'react';
import { Terminal, ShieldAlert, Play, Sparkles } from '@/lib/lucide-google-icons';

interface CodingStartCardProps {
  company: string;
  role: string;
  problemTitle: string;
  difficulty: string;
  category: string;
  onStart: () => void;
}

export function CodingStartCard({
  company,
  role,
  problemTitle,
  difficulty,
  category,
  onStart,
}: CodingStartCardProps) {
  const [consent, setConsent] = useState(true);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <div className="w-full max-w-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-6 text-center backdrop-blur-md">
        
        <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 shadow-sm animate-pulse">
          <Terminal className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 uppercase">
            <Sparkles className="h-3 w-3" />
            <span>Interactive IDE Round</span>
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white pt-1">
            Live Coding Assessment
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {role} Position at <span className="font-bold text-indigo-500">{company}</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-left space-y-3">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Target Challenge
          </span>
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{problemTitle}</h4>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{category}</p>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400">
              {difficulty}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider">
            <ShieldAlert className="h-4.5 w-4.5" />
            <span>Proctored Session Instructions</span>
          </div>
          <ul className="text-slate-600 dark:text-slate-300 text-[11px] space-y-2 list-disc pl-4 font-medium leading-relaxed">
            <li>You must work strictly in the provided workspace.</li>
            <li>Exiting fullscreen or switching windows will register a <strong>Proctoring Strike violation</strong>.</li>
            <li>Accumulating <strong>3 strikes</strong> will immediately end the session and result in disqualification (0% score).</li>
          </ul>
        </div>

        <div className="space-y-4 pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer text-left select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-500 cursor-pointer h-4 w-4"
            />
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-normal">
              I agree to the assessment security rules and consent to fullscreen monitoring.
            </span>
          </label>

          <button
            type="button"
            disabled={!consent}
            onClick={onStart}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            <Play className="h-4 w-4" />
            <span>Launch Coding IDE &amp; Start Round</span>
          </button>
        </div>

      </div>
    </div>
  );
}
