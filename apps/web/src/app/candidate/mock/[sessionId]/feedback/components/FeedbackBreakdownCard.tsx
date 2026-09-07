'use client';

import React from 'react';
import { TrendingUp } from '@/lib/lucide-google-icons';

interface FeedbackBreakdownCardProps {
  technicalScore: number;
  commScore: number;
  sysScore: number;
}

export function FeedbackBreakdownCard({
  technicalScore,
  commScore,
  sysScore,
}: FeedbackBreakdownCardProps) {
  const competencies = [
    { name: 'Technical Architecture', score: technicalScore, color: 'bg-emerald-500' },
    { name: 'Communication & Pacing', score: commScore, color: 'bg-brand-500' },
    { name: 'System Architecture', score: sysScore, color: 'bg-sky-500' },
  ];

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
          Competency Evaluation Breakdown
        </h3>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Benchmark Standard
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        {competencies.map((c) => (
          <div
            key={c.name}
            className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
          >
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {c.name}
            </span>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
                {c.score}%
              </span>
              <span
                className={`text-[10px] font-bold ${
                  c.score >= 70
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : c.score > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {c.score >= 70
                  ? 'Target Passed'
                  : c.score > 0
                  ? 'Needs Calibration'
                  : 'Pending Evaluation'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div className={`${c.color} h-full rounded-full`} style={{ width: `${c.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
