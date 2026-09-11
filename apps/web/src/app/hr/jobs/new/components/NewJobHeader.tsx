'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, Save, Send, Sparkles } from '@/lib/lucide-google-icons';

interface NewJobHeaderProps {
  isRubricBalanced: boolean;
  completionScore?: number;
  onSaveDraft: () => void;
  onPublish: (e: React.FormEvent) => void;
}

export function NewJobHeader({
  isRubricBalanced,
  completionScore = 25,
  onSaveDraft,
  onPublish,
}: NewJobHeaderProps) {
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
          <span className="text-slate-700 dark:text-slate-200 font-extrabold">New Job</span>
        </nav>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Create Job Opening
          </h1>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-500/20 text-[11px] font-bold">
            <Sparkles className="h-3 w-3 text-brand-600 dark:text-brand-400" />
            <span>AI Automated Pipeline</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          Configure role criteria, automated AI assessments, candidate scoring rubrics, and hiring workflow.
        </p>
      </div>

      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
        <div className="hidden lg:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 font-semibold">Progress:</span>
          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(10, completionScore))}%` }}
            />
          </div>
          <span className="font-extrabold text-slate-800 dark:text-slate-200">{completionScore}%</span>
        </div>

        <Link
          href="/hr/jobs"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cancel
        </Link>

        <button
          type="button"
          onClick={onSaveDraft}
          className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Save className="h-3.5 w-3.5 text-slate-400" />
          Save Draft
        </button>

        <button
          type="button"
          disabled={!isRubricBalanced}
          onClick={onPublish}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white font-black px-5 py-2 text-xs shadow-md shadow-brand-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <Send className="h-3.5 w-3.5" />
          Publish Role
        </button>
      </div>
    </div>
  );
}
