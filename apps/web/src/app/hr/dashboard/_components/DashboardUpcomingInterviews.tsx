'use client';

import React from 'react';
import { Calendar, Clock } from '@/lib/lucide-google-icons';

export interface UpcomingAssessment {
  id: string;
  candidateName: string;
  jobTitle: string;
  slot: string;
}

interface DashboardUpcomingInterviewsProps {
  upcomingAssessments: UpcomingAssessment[];
}

export function DashboardUpcomingInterviews({
  upcomingAssessments,
}: DashboardUpcomingInterviewsProps) {
  return (
    <div className="glass-card p-5 space-y-4">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 dark:border-slate-800 pb-2 flex items-center gap-1.5">
        <Calendar className="h-4 w-4 text-brand-600 dark:text-orange-400" />
        Upcoming Interviews
      </span>

      {upcomingAssessments.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center py-2">
          No interviews scheduled
        </p>
      ) : (
        <div className="space-y-3.5">
          {upcomingAssessments.map((a) => (
            <div
              key={a.id}
              className="space-y-1 border-b border-slate-200/60 dark:border-slate-800 pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-slate-100">
                <span>{a.candidateName}</span>
                <span className="text-brand-700 dark:text-orange-300 bg-brand-50 dark:bg-orange-950/60 border border-brand-100 dark:border-orange-900/60 px-2 py-0.5 rounded flex items-center gap-1 font-mono text-[10px]">
                  <Clock className="h-3 w-3" />
                  {a.slot}
                </span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight">
                <span>{a.jobTitle}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
