'use client';

import React from 'react';
import { MapPin, IndianRupee, Briefcase, Calendar } from '@/lib/lucide-google-icons';
import { Job } from '@/types';

export function JobOverviewCard({ job }: { job: Job }) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-md glass-panel space-y-4">
      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 font-display">
        Overview
      </h3>
      <div className="space-y-3.5 text-xs font-semibold">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
              Location
            </span>
            <span className="text-slate-800 dark:text-slate-200">{job.location}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <IndianRupee className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
              Yearly Salary
            </span>
            <span className="text-slate-800 dark:text-slate-200">{job.salary}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
          <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
              Experience Level
            </span>
            <span className="text-slate-800 dark:text-slate-200">{job.experienceLevel}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
          <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
              Date Posted
            </span>
            <span className="text-slate-800 dark:text-slate-200">{job.postedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
