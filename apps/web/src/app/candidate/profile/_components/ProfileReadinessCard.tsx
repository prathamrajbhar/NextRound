'use client';

import React from 'react';

export function ProfileReadinessCard({ readiness }: { readiness: number }) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel text-center space-y-4">
      <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
        Profile Completeness
      </span>

      <div className="relative h-28 w-28 mx-auto my-2 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-200 dark:text-slate-800"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-brand-500 dark:text-orange-500 transition-all duration-500"
            strokeDasharray={`${readiness}, 100`}
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className="absolute text-xl font-black text-slate-900 dark:text-slate-100">{readiness}%</span>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900 inline-block">
          {readiness >= 90 ? 'Profile Calibrated' : readiness >= 60 ? 'Profile In Progress' : 'Initial Setup'}
        </span>
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-1">
          Complete your contact details and resume to reach 100% recruiter match readiness.
        </p>
      </div>
    </div>
  );
}
