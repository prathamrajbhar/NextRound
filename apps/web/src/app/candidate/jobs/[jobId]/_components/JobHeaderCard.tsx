'use client';

import React from 'react';
import { CompanyLogo } from '@/components/ui';
import {
  MapPin,
  IndianRupee,
  Briefcase,
  CheckCircle2,
  Check,
  ArrowRight,
  Layers,
} from '@/lib/lucide-google-icons';

import { Job } from '@/types';

interface JobHeaderCardProps {
  job: Job;
  applied: boolean;
  onApply: () => void;
  skills: string[];
  submitting?: boolean;
}

export function JobHeaderCard({ job, applied, onApply, skills, submitting = false }: JobHeaderCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/70 via-white/50 to-slate-50/50 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-950/80 p-6 md:p-8 shadow-md backdrop-blur-md glass-panel">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <CompanyLogo name={job.orgName} logoUrl={job.orgLogo} size="xl" className="shadow-md flex-shrink-0" />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-brand-600 dark:text-orange-400 flex items-center gap-1">
                {job.orgName}
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10" />
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60 uppercase">
                Active Hiring
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1 font-display leading-tight">
              {job.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                {job.location}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <IndianRupee className="h-3.5 w-3.5" />
                {job.salary}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                {job.experienceLevel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-shrink-0">
          {applied ? (
            <div className="inline-flex items-center justify-center gap-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 rounded-full px-6 py-3 shadow-sm animate-in scale-in duration-200">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Application Submitted
            </div>
          ) : (
            <button
              onClick={onApply}
              disabled={submitting}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 px-8 py-3 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{submitting ? 'Submitting Application...' : 'Apply to this Role'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
          <Layers className="h-3 w-3" /> Tech Stack:
        </span>
        {skills.length > 0 ? (
          skills.map((skill) => (
            <span
              key={skill}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/80"
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-400 border border-slate-200/60 dark:border-slate-700/80">
            Not specified
          </span>
        )}
      </div>
    </div>
  );
}
