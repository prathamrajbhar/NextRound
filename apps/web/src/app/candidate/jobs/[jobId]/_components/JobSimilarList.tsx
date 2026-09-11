'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from '@/lib/lucide-google-icons';
import { CompanyLogo } from '@/components/ui';
import { Job } from '@/types';

export function JobSimilarList({ similarJobs }: { similarJobs: Job[] }) {
  if (similarJobs.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
        Similar Opportunities
      </h3>
      <div className="space-y-3">
        {similarJobs.map((simJob) => (
          <Link
            key={simJob.id}
            href={`/candidate/jobs/${simJob.id}`}
            className="flex items-center gap-3 rounded-2xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-3.5 shadow-sm hover:shadow transition-all glass-panel glass-panel-hover"
          >
            <CompanyLogo name={simJob.orgName} logoUrl={simJob.orgLogo} size="sm" />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {simJob.title}
              </h4>
              <span className="text-[10px] font-bold text-brand-600 dark:text-orange-400 block">
                {simJob.orgName}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
