'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from '@/lib/lucide-google-icons';

interface EditJobHeaderProps {
  isRubricBalanced: boolean;
  submitting: boolean;
  onUpdate: (e: React.FormEvent) => void;
}

export function EditJobHeader({
  isRubricBalanced,
  submitting,
  onUpdate,
}: EditJobHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
      <div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">
          <Link href="/hr/jobs" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            Jobs
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-slate-700 dark:text-slate-300">Edit Settings</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
          Edit Job Opening
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Modify job specifications, active pipeline stages, evaluation parameters, and gating thresholds.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/hr/jobs"
          className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Link>
        <button
          type="button"
          disabled={!isRubricBalanced || submitting}
          onClick={onUpdate}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold px-6 py-2.5 text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 hover:scale-[1.01]"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin text-white" />}
          {submitting ? 'Updating Job...' : 'Update Job Listing'}
        </button>
      </div>
    </div>
  );
}
