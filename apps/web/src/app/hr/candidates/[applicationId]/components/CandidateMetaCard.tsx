'use client';

import React from 'react';
import { Application, Job } from '@/types';

interface CandidateMetaCardProps {
  app: Application;
  job?: Job | null;
}

export function CandidateMetaCard({ app, job }: CandidateMetaCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-display border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
        Profile Meta Details
      </h4>
      <div className="space-y-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Email Address</span>
          <span className="text-slate-800 dark:text-slate-200 block mt-0.5">{app.candidateEmail}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Current Status</span>
          <span className="text-slate-800 dark:text-slate-200 block mt-0.5 capitalize">{app.stage}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Applied Role</span>
          <span className="text-slate-800 dark:text-slate-200 block mt-0.5">{job?.title || app.jobTitle}</span>
        </div>
        {app.location && (
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Preferred Location</span>
            <span className="text-slate-800 dark:text-slate-200 block mt-0.5">{app.location}</span>
          </div>
        )}
        {app.noticePeriod && (
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Notice Period</span>
            <span className="text-slate-800 dark:text-slate-200 block mt-0.5">{app.noticePeriod}</span>
          </div>
        )}
        {app.expectedSalary && (
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Expected Salary</span>
            <span className="text-slate-800 dark:text-slate-200 block mt-0.5">${app.expectedSalary.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
