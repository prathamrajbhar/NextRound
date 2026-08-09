'use client';

import React from 'react';
import Link from 'next/link';
import { Job } from '@/types';
import { JobCard } from '@/components/ui';
import { Compass, Search, ArrowRight, Sparkles } from '@/lib/lucide-google-icons';

interface CandidateJobsSectionProps {
  jobs: Job[];
}

export function CandidateJobsSection({ jobs }: CandidateJobsSectionProps) {
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const recommendations = safeJobs.slice(0, 3);

  if (recommendations.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          <span>Recommended For You</span>
        </h2>

        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 p-6 text-center shadow-lg space-y-4 transition-colors">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
            <Compass className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">No Matching Jobs Yet</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 leading-relaxed">
              We&apos;re updating role matches based on your profile skills. Check out the job board for all openings.
            </p>
          </div>

          <Link
            href="/candidate/jobs"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Browse Job Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          <span>Recommended For You</span>
        </h2>
        <Link
          href="/candidate/jobs"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 inline-flex items-center gap-1"
        >
          <span>View all</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-4">
        {recommendations.map((job, idx) => (
          <JobCard
            key={job.id}
            id={job.id}
            orgName={job.orgName}
            orgLogo={job.orgLogo}
            title={job.title}
            description={job.description}
            location={job.location}
            salary={job.salary}
            experienceLevel={job.experienceLevel}
            postedDate={job.postedDate}
            status={job.status}
            matchScore={idx === 0 ? 92 : idx === 1 ? 84 : 76}
            viewHref={`/candidate/jobs/${job.id}`}
            compact
          />
        ))}
      </div>
    </div>
  );
}
