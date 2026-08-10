'use client';

import React from 'react';
import { CompanyLogo } from '@/components/ui';
import { CheckCircle2, ArrowRight, Maximize2 } from '@/lib/lucide-google-icons';

interface NextRoundTransitionCardProps {
  companyName: string;
  roleTitle: string;
  stageNumber: number;
  completedStageName: string;
  completedScore: number;
  nextStageName: string;
  onLaunch: () => void;
}

/**
 * Inter-round overlay shown between comprehensive-assessment stages: the
 * completed stage's score plus the up-next stage with a full-screen launch
 * action.
 */
export function NextRoundTransitionCard({
  companyName,
  roleTitle,
  stageNumber,
  completedStageName,
  completedScore,
  nextStageName,
  onLaunch,
}: NextRoundTransitionCardProps) {
  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-6 animate-in fade-in duration-200 font-sans transition-colors duration-300">
      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center backdrop-blur-md">
        <div className="space-y-2">
          <CompanyLogo name={companyName} size="lg" className="mx-auto shadow-md" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white font-display pt-1">{companyName}</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{roleTitle}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-slate-950 border border-emerald-200 dark:border-slate-800 space-y-2">
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Stage {stageNumber} Completed
          </span>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            {completedStageName}
          </h3>
          <span className="text-xl font-black text-brand-600 dark:text-amber-400 block pt-1">
            Score: {completedScore}%
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1 text-left">
          <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
            Up Next: Stage {stageNumber + 1}
          </span>
          <h4 className="text-xs font-black text-amber-900 dark:text-amber-200">{nextStageName}</h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium pt-0.5">
            Ready to enter full-screen proctored environment for the next round.
          </p>
        </div>

        <button
          type="button"
          onClick={onLaunch}
          className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Maximize2 className="h-4 w-4" />
          <span>Start Stage {stageNumber + 1}: {nextStageName}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
