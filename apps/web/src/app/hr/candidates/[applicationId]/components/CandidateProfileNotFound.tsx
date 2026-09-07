'use client';

import React from 'react';
import Link from 'next/link';
import { User } from '@/lib/lucide-google-icons';

export function CandidateProfileNotFound() {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-8 text-center space-y-4 max-w-md mx-auto my-12 backdrop-blur-md glass-panel">
      <div className="h-12 w-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
        <User className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display">
          Candidate Profile Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          The requested candidate profile may have been removed or does not exist.
        </p>
      </div>
      <Link
        href="/hr/jobs"
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
      >
        Back to HR Job Postings
      </Link>
    </div>
  );
}
