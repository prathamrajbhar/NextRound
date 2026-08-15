'use client';

import React from 'react';
import { Award } from '@/lib/lucide-google-icons';

interface AptitudeResultScreenProps {
  companyName: string;
  roleTitle: string;
  score: number;
  isEliminated: boolean;
  onContinue: () => void;
}

export function AptitudeResultScreen({ companyName, roleTitle, score, isEliminated, onContinue }: AptitudeResultScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center animate-in fade-in duration-300 font-sans">
      <div
        className={`p-8 rounded-3xl border shadow-2xl max-w-md w-full space-y-6 ${
          isEliminated
            ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
        }`}
      >
        <div
          className={`h-20 w-20 mx-auto rounded-2xl flex items-center justify-center border shadow-md ${
            isEliminated
              ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400'
              : 'bg-brand-50 dark:bg-brand-950/50 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400'
          }`}
        >
          <Award className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black font-display tracking-tight">
            {isEliminated ? 'Candidate Disqualified' : 'Assessment Completed'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isEliminated ? 'Exceeded 3 proctoring full-screen violations.' : `Target Enterprise: ${companyName} • ${roleTitle}`}
          </p>
        </div>

        {!isEliminated ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Aptitude Composite Score
            </span>
            <span className="text-3xl font-black text-brand-600 dark:text-orange-400">{score}%</span>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-rose-100/60 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 space-y-1">
            <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300 uppercase tracking-wider block">
              Elimination Status
            </span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400">0% • Fullscreen Violation</span>
          </div>
        )}

        <button
          type="button"
          onClick={onContinue}
          className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
        >
          Continue to Next Stage
        </button>
      </div>
    </div>
  );
}
