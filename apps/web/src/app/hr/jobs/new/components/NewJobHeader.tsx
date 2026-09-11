'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, Save, Send } from 'lucide-react';

interface NewJobHeaderProps {
  isRubricBalanced: boolean;
  onSaveDraft: () => void;
  onPublish: (e: React.FormEvent) => void;
}

export function NewJobHeader({
  isRubricBalanced,
  onSaveDraft,
  onPublish,
}: NewJobHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider mb-1">
          <Link href="/hr/jobs" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Jobs
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
          <span className="text-slate-700 dark:text-slate-200 font-black">New Job</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
          Post a New Job
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
          Fill in the job details, AI test requirements, and hiring steps to start finding candidates.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/hr/jobs"
          className="inline-flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Link>

        <button
          type="button"
          onClick={onSaveDraft}
          className="inline-flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all shadow-xs cursor-pointer"
        >
          <Save className="h-4 w-4 text-slate-500" />
          Save Draft
        </button>

        <button
          type="button"
          disabled={!isRubricBalanced}
          onClick={onPublish}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white font-extrabold px-5 py-2 text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-3.5 w-3.5" />
          Publish Job
        </button>
      </div>
    </div>
  );
}
