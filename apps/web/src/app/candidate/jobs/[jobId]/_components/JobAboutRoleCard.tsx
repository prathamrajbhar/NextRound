'use client';

import React from 'react';
import { Building2, Check } from '@/lib/lucide-google-icons';
import { FormattedMarkdown } from '@/components/ui';
import { Job } from '@/types';

export function JobAboutRoleCard({ job }: { job: Job }) {
  const hasDetailedMarkdown =
    job.description && (job.description.includes('##') || job.description.includes('*'));

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 p-6 md:p-8 shadow-sm backdrop-blur-md glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
          <Building2 className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          About the Role
        </h2>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
          Posted on {job.postedDate}
        </span>
      </div>

      <FormattedMarkdown content={job.description} />

      {!hasDetailedMarkdown && (
        <div className="pt-2">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
            Core Responsibilities
          </h3>
          <div className="space-y-2.5">
            {[
              'Design, deploy, and benchmark core features and architectural specifications.',
              'Write production-grade, maintainable code with strict TypeScript compilers and unit coverage.',
              'Collaborate with UI/UX designers to build high-performance, accessible dashboard layouts.',
              'Integrate robust error boundaries, structured monitoring, and telemetry middleware.',
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-brand-50 dark:bg-orange-950/60 border border-brand-200 dark:border-orange-900/60 flex items-center justify-center text-brand-600 dark:text-orange-400 flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
