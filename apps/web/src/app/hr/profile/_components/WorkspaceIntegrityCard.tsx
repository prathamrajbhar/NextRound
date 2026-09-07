'use client';

import React from 'react';

export function WorkspaceIntegrityCard() {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel text-center">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
        Workspace Integrity
      </span>
      <div className="relative h-24 w-24 mx-auto my-4 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-100 dark:text-slate-800"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-purple-600 dark:text-purple-400"
            strokeDasharray="95, 100"
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className="absolute text-lg font-black text-slate-800 dark:text-slate-100">95%</span>
      </div>
      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/60 w-fit mx-auto block mb-2">
        Certified Recruiter
      </span>
      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block leading-relaxed">
        Verify your organizational credentials to lock tenant hiring authorities.
      </span>
    </div>
  );
}
