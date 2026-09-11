'use client';

import React from 'react';
import { ChevronRight } from '@/lib/lucide-google-icons';

interface PipelineBreadcrumbsProps {
  stages: ('screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision')[];
}

export function PipelineBreadcrumbs({ stages }: PipelineBreadcrumbsProps) {
  const isActive = (stage: 'screening' | 'assessment' | 'voice_screen' | 'panel') =>
    stages.includes(stage);

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1.5 select-none border-b border-slate-200/60 dark:border-slate-800 pb-3.5">
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
        Applied
      </span>
      <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />

      {isActive('screening') && (
        <>
          <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-lg border border-brand-200/50 dark:border-brand-800/40">
            Resume Screen
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        </>
      )}

      {isActive('assessment') && (
        <>
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
            Online Assessment
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        </>
      )}

      {isActive('voice_screen') && (
        <>
          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-200/50 dark:border-purple-800/40">
            AI Voice Screen
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        </>
      )}

      {isActive('panel') && (
        <>
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200/50 dark:border-rose-800/40">
            Hiring Team Interview
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        </>
      )}

      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40">
        Offer / Decision
      </span>
    </div>
  );
}
