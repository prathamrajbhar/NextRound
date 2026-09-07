'use client';

import React from 'react';
import Link from 'next/link';
import { Layers } from '@/lib/lucide-google-icons';
import { Job } from '@/types';

interface DashboardActiveJobsCardProps {
  activeJobs: Job[];
}

export function DashboardActiveJobsCard({ activeJobs }: DashboardActiveJobsCardProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
        <Layers className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
        Active Jobs
      </h2>
      {activeJobs.length === 0 ? (
        <div className="glass-card p-6 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
          No active job postings found. Click &quot;Post a New Job&quot; to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeJobs.slice(0, 2).map((job) => (
            <div key={job.id} className="glass-card p-5 flex flex-col justify-between min-h-[120px]">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {job.title}
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold block mt-1">
                  {job.location} • {job.salary}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                  {job.applicantsCount || 0} in pipeline
                </span>
                <Link
                  href={`/hr/jobs/${job.id}/pipeline`}
                  className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  View Pipeline
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
