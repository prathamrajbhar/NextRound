'use client';

import React from 'react';
import { Clock, TrendingUp, Award, DollarSign } from '@/lib/lucide-google-icons';

interface AnalyticsKpiCardsProps {
  data?: {
    avgTimeToHireDays?: number;
    totalApplications?: number;
    activeJobs?: number;
    offerAcceptanceRatePercent?: number;
  };
}

export function AnalyticsKpiCards({ data }: AnalyticsKpiCardsProps) {
  const avgHours = data?.avgTimeToHireDays ? data.avgTimeToHireDays * 24 : 0;
  const passRate = data?.offerAcceptanceRatePercent ?? 0;
  const totalApps = data?.totalApplications ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel flex items-center justify-between hover:scale-[1.01] transition-all">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
            Average Time to Hire
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-display block">
            {avgHours > 0 ? `${avgHours} Hours` : 'N/A'}
          </span>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <TrendingUp className="h-3 w-3" /> Real-time Org Metric
          </span>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900/60 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
          <Clock className="h-5.5 w-5.5" />
        </div>
      </div>

      {}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel flex items-center justify-between hover:scale-[1.01] transition-all">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
            Candidates Passing AI Test
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-display block">
            {passRate}%
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
            {totalApps} candidate application{totalApps === 1 ? '' : 's'} tracked
          </span>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
          <Award className="h-5.5 w-5.5" />
        </div>
      </div>

      {}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel flex items-center justify-between hover:scale-[1.01] transition-all">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
            Active Open Jobs
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-display block">
            {data?.activeJobs ?? 0}
          </span>
          <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 block">
            Live organization pipelines
          </span>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
          <DollarSign className="h-5.5 w-5.5" />
        </div>
      </div>
    </div>
  );
}
