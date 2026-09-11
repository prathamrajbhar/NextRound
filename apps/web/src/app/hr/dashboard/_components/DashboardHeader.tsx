'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from '@/lib/lucide-google-icons';

export function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Recruiter Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Check upcoming interviews, review candidate scores, and track hiring rates.
        </p>
      </div>
      <Link
        href="/hr/jobs/new"
        className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Post a New Job
      </Link>
    </div>
  );
}
