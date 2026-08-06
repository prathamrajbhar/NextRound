'use client';

import React from 'react';
import { CompanyLogo } from '@/components/ui';
import { CheckCircle2, ShieldCheck, Clock } from '@/lib/lucide-google-icons';

import { Application } from '@/lib/mockData';

interface ApplicationHeaderBannerProps {
  app: Application;
  jobLogo?: string;
  matchPercent: number;
}

export function ApplicationHeaderBanner({ app, jobLogo, matchPercent }: ApplicationHeaderBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/70 via-white/50 to-slate-50/50 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-950/80 p-6 md:p-8 shadow-md backdrop-blur-md glass-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="flex items-center gap-4 min-w-0">
        <CompanyLogo name={app.orgName} logoUrl={jobLogo} size="xl" className="shadow-md flex-shrink-0" />

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Application Tracking
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {matchPercent}% AI Qualification Score
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1 font-display leading-tight">
            {app.jobTitle}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="font-bold text-brand-600 dark:text-orange-400 flex items-center gap-1">
              {app.orgName}
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5" /> Applied on {app.appliedDate}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-auto">
        <span
          className={`text-xs font-extrabold px-4 py-1.5 rounded-full border uppercase tracking-wider shadow-2xs ${
            app.status === 'decided'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : app.status === 'interview_scheduled'
              ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
              : 'bg-brand-50 dark:bg-orange-950/80 text-brand-700 dark:text-orange-300 border-brand-200 dark:border-orange-800'
          }`}
        >
          {app.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}
