'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface PipelineBreadcrumbsProps {
  stages: ('screening' | 'assessment' | 'voice_screen' | 'hr_round' | 'panel' | 'decision')[];
}

export function PipelineBreadcrumbs({ stages }: PipelineBreadcrumbsProps) {
  const isActive = (stage: 'screening' | 'assessment' | 'voice_screen' | 'panel') =>
    stages.includes(stage);

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-2 select-none border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
      <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
        Applied
      </span>
      <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />

      {isActive('screening') && (
        <>
          <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg">
            Resume Check
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        </>
      )}

      {isActive('assessment') && (
        <>
          <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-1 rounded-lg">
            Online Test
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        </>
      )}

      {isActive('voice_screen') && (
        <>
          <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2.5 py-1 rounded-lg">
            Voice Call
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        </>
      )}

      {isActive('panel') && (
        <>
          <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 px-2.5 py-1 rounded-lg">
            Team Interview
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        </>
      )}

      <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg">
        Hire Decision
      </span>
    </div>
  );
}
