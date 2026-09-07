'use client';

import React from 'react';
import Link from 'next/link';
import { Users, ArrowUpRight, CheckCircle2 } from '@/lib/lucide-google-icons';
import { Job } from '@/types';

interface ActiveJobListingsTableProps {
  jobs: Job[];
}

export function ActiveJobListingsTable({ jobs }: ActiveJobListingsTableProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
            Active Job Listings &amp; Applicant Count
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Live overview of candidates across active open roles.
          </p>
        </div>

        <Link
          href="/hr/jobs"
          className="text-brand-600 dark:text-orange-400 hover:underline text-xs font-extrabold flex items-center gap-0.5 cursor-pointer"
        >
          <span>View All Jobs</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/60 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              <th className="py-3 px-4">Job Title</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Total Applicants</th>
              <th className="py-3 px-4">Pass Rate</th>
              <th className="py-3 px-4">Average Candidate Score</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
            {jobs.length > 0 ? (
              jobs.slice(0, 5).map((j) => (
                <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-slate-900 dark:text-slate-100 font-display">{j.title}</div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                      {j.orgName || 'Organization'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{j.location || 'Remote'}</td>
                  <td className="py-3.5 px-4 font-bold">{j.applicantsCount || 0} candidates</td>
                  <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {j.applicantsCount ? '—' : '0%'}
                  </td>
                  <td className="py-3.5 px-4 font-bold">
                    {j.thresholds?.minScore ? `${j.thresholds.minScore}%` : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      {j.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-slate-400 font-medium">
                  No active job listings found in database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
