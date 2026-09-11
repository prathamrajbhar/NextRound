'use client';

import React from 'react';

interface DashboardHiringFunnelProps {
  totalApplied: number;
  totalVetted: number;
  vettedPct: number;
  totalHired: number;
  hiredPct: number;
}

export function DashboardHiringFunnel({
  totalApplied,
  totalVetted,
  vettedPct,
  totalHired,
  hiredPct,
}: DashboardHiringFunnelProps) {
  return (
    <div className="glass-card p-5 space-y-4">
      <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 dark:border-slate-800 pb-2">
        Hiring Funnel
      </span>

      <div className="space-y-4 pt-1">
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            <span>Applied</span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100">{totalApplied} Candidates</span>
          </div>
          <div className="w-full bg-white/45 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700 rounded-full h-1.5 p-0.5">
            <div className="bg-brand-500 dark:bg-orange-400 h-0.5 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            <span>Interviewed</span>
            <span className="font-extrabold text-brand-600 dark:text-orange-400">
              {totalVetted} Candidates ({vettedPct}%)
            </span>
          </div>
          <div className="w-full bg-white/45 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700 rounded-full h-1.5 p-0.5">
            <div className="bg-brand-500 dark:bg-orange-400 h-0.5 rounded-full" style={{ width: `${vettedPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            <span>Hired</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              {totalHired} Hires ({hiredPct}%)
            </span>
          </div>
          <div className="w-full bg-white/45 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700 rounded-full h-1.5 p-0.5">
            <div className="bg-emerald-500 dark:bg-emerald-400 h-0.5 rounded-full" style={{ width: `${hiredPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
