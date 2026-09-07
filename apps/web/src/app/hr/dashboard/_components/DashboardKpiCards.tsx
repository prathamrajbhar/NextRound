'use client';

import React from 'react';
import { Briefcase, Users, Sparkles, CheckCircle2 } from '@/lib/lucide-google-icons';

interface DashboardKpiCardsProps {
  activeJobsCount: number;
  totalCandidates: number;
  interviewingCandidates: number;
  decisionsCount: number;
}

export function DashboardKpiCards({
  activeJobsCount,
  totalCandidates,
  interviewingCandidates,
  decisionsCount,
}: DashboardKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-orange-950/50 border border-brand-100 dark:border-orange-900/60 flex items-center justify-center text-brand-600 dark:text-orange-400 shadow-sm">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <span className="block text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {activeJobsCount}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
            Active Jobs
          </span>
        </div>
      </div>

      <div className="glass-card p-5 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-100 dark:border-orange-900/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <span className="block text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {totalCandidates}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
            Total Candidates
          </span>
        </div>
      </div>

      <div className="glass-card p-5 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <span className="block text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {interviewingCandidates}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
            Scheduled Interviews
          </span>
        </div>
      </div>

      <div className="glass-card p-5 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <span className="block text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {decisionsCount}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
            Hires Made
          </span>
        </div>
      </div>
    </div>
  );
}
