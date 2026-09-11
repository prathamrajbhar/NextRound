'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, TrendingUp, ShieldAlert, ChevronRight } from '@/lib/lucide-google-icons';
import { Application } from '@/types';

export interface VettedCandidate extends Application {
  tech: number;
  comm: number;
  composite: number;
  proctorFlagsCount: number;
}

interface DashboardReviewTableProps {
  vettedCandidates: VettedCandidate[];
}

export function DashboardReviewTable({ vettedCandidates }: DashboardReviewTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
          Candidates to Review
        </h2>
        <span className="text-xs font-bold text-brand-700 dark:text-orange-300 bg-brand-50 dark:bg-orange-950/60 border border-brand-100 dark:border-orange-900/60 px-2.5 py-0.5 rounded-full uppercase">
          Needs Review
        </span>
      </div>

      <div className="glass-card overflow-hidden">
        {vettedCandidates.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
            No applications pending review.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800 bg-white/20 dark:bg-slate-800/40 text-slate-400 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4.5">Candidate</th>
                  <th className="px-6 py-4.5">Evaluation Score</th>
                  <th className="px-6 py-4.5">Skills (Tech / Comm)</th>
                  <th className="px-6 py-4.5">Warnings</th>
                  <th className="px-6 py-4.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {vettedCandidates.map((app) => (
                  <tr key={app.id} className="hover:bg-white/20 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="block font-black text-slate-800 dark:text-slate-100 text-sm">
                        {app.candidateName}
                      </span>
                      <span className="block text-xs text-slate-400 dark:text-slate-400 font-bold mt-0.5">
                        {app.jobTitle ? app.jobTitle.split('—')[0] : 'Role'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-orange-950/60 text-brand-700 dark:text-orange-300 border border-brand-100 dark:border-orange-900/60">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {app.composite}%
                      </span>
                    </td>
                    <td className="px-6 py-4 space-y-1.5">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-400 mb-0.5">
                          <span>Technical</span>
                          <span>{app.tech}%</span>
                        </div>
                        <div className="w-24 bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-1">
                          <div
                            className="bg-brand-500 dark:bg-orange-400 h-1 rounded-full"
                            style={{ width: `${app.tech}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-400 mb-0.5">
                          <span>Communication</span>
                          <span>{app.comm}%</span>
                        </div>
                        <div className="w-24 bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-1">
                          <div
                            className="bg-brand-500 dark:bg-orange-400 h-1 rounded-full"
                            style={{ width: `${app.comm}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {app.proctorFlagsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/60 px-2.5 py-1 rounded-full">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          {app.proctorFlagsCount === 1 ? '1 Warning' : `${app.proctorFlagsCount} Warnings`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 px-2.5 py-1 rounded-full">
                          No Flags
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/hr/candidates/${app.id}`}
                        className="inline-flex items-center gap-0.5 text-sm font-extrabold text-brand-600 dark:text-orange-400 hover:underline transition-colors"
                      >
                        Review Profile
                        <ChevronRight className="h-4.5 w-4.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
