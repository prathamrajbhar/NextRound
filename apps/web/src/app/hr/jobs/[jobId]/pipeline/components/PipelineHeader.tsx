'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, Play, Pause, Sliders } from '@/lib/lucide-google-icons';

interface PipelineHeaderProps {
  jobTitle: string;
  pipelineActive: boolean;
  setPipelineActive: (val: boolean) => void;
  onOpenSettings: () => void;
}

export default function PipelineHeader({
  jobTitle,
  pipelineActive,
  setPipelineActive,
  onOpenSettings,
}: PipelineHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4 font-sans">
      <div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
          <Link href="/hr/jobs" className="hover:text-brand-600 dark:hover:text-orange-400 transition-colors">
            All Jobs
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
          <span className="text-slate-600 dark:text-slate-300 block truncate max-w-[200px]">{jobTitle}</span>
          <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
          <span className="text-slate-800 dark:text-slate-200 font-extrabold">Recruitment Pipeline</span>
        </div>

        <div className="flex items-center gap-2.5">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            {jobTitle}
          </h1>
          <span
            title={pipelineActive ? 'Auto-Evaluation Pipeline Active' : 'Pipeline Paused'}
            className={`h-2.5 w-2.5 rounded-full ${pipelineActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'} block`}
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <Link
          href="/hr/jobs"
          className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Jobs</span>
        </Link>

        <button
          type="button"
          onClick={() => setPipelineActive(!pipelineActive)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-2xs transition-all cursor-pointer border ${
            pipelineActive
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
          }`}
        >
          {pipelineActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>{pipelineActive ? 'Auto-Pipeline: Active' : 'Auto-Pipeline: Paused'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <Sliders className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Gating Thresholds</span>
        </button>
      </div>
    </div>
  );
}
