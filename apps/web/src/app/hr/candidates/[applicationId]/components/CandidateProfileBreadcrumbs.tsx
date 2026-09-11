'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, Award } from '@/lib/lucide-google-icons';

interface CandidateProfileBreadcrumbsProps {
  jobId: string;
  applicationId: string;
  candidateName: string;
}

export function CandidateProfileBreadcrumbs({
  jobId,
  applicationId,
  candidateName,
}: CandidateProfileBreadcrumbsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Link href="/hr/jobs" className="hover:text-brand-600 dark:hover:text-orange-400 transition-colors">
          Jobs
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
        <Link href={`/hr/jobs/${jobId}/pipeline`} className="hover:text-brand-600 dark:hover:text-orange-400 transition-colors">
          Pipeline
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
        <span className="text-slate-900 dark:text-slate-200 font-extrabold">{candidateName}</span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/hr/jobs/${jobId}/pipeline`}
          className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Pipeline</span>
        </Link>
        <Link
          href={`/hr/candidates/${applicationId}/scoring`}
          className="inline-flex items-center gap-1.5 bg-emerald-600 dark:bg-emerald-650 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer hover:scale-[1.01]"
        >
          <Award className="h-4 w-4" />
          <span>View Scoring Report</span>
        </Link>
      </div>
    </div>
  );
}
