'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, Loader2, Sparkles, Check } from '@/lib/lucide-google-icons';

interface EditJobHeaderProps {
  isRubricBalanced: boolean;
  submitting: boolean;
  onUpdate: (e?: React.FormEvent) => void;
  status: 'active' | 'draft' | 'closed';
}

export function EditJobHeader({
  isRubricBalanced,
  submitting,
  onUpdate,
  status,
}: EditJobHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/70 dark:border-slate-800/80 pb-5">
      <div>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
          <Link
            href="/hr/jobs"
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors inline-flex items-center gap-1"
          >
            <span>Jobs</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
          <span className="text-brand-600 dark:text-brand-400 font-extrabold">Studio</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
          <span className="text-slate-700 dark:text-slate-200 font-extrabold">Edit Opening</span>
        </nav>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Edit Job Opening
          </h1>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-500/20 text-[11px] font-bold">
            <Sparkles className="h-3 w-3 text-brand-600 dark:text-brand-400" />
            <span>AI Automated Pipeline</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          Modify job specifications, active pipeline stages, evaluation parameters, and gating thresholds.
        </p>
      </div>

      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
        <Link
          href="/hr/jobs"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cancel
        </Link>

        <button
          type="button"
          disabled={!isRubricBalanced || submitting}
          onClick={onUpdate}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white font-black px-5 py-2.5 text-xs shadow-md shadow-brand-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          {submitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Update Job Listing</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
