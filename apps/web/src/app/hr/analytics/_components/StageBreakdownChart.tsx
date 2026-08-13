'use client';

import React from 'react';
import { BarChart3 } from '@/lib/lucide-google-icons';

interface FunnelStep {
  name: string;
  count: number;
  pct: number;
}

interface StageBreakdownChartProps {
  funnelSteps: FunnelStep[];
}

export function StageBreakdownChart({ funnelSteps }: StageBreakdownChartProps) {
  const firstCount = funnelSteps[0]?.count;
  const lastCount = funnelSteps[funnelSteps.length - 1]?.count;
  const passRate =
    firstCount && lastCount && firstCount > 0
      ? Math.round((lastCount / firstCount) * 1000) / 10
      : null;

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-display">
            <BarChart3 className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
            Hiring Stage Breakdown
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Number of candidates remaining at each interview stage.
          </p>
        </div>
        {passRate !== null && (
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
            {passRate}% Final Pass Rate
          </span>
        )}
      </div>

      <div className="space-y-4">
        {funnelSteps.map((step, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-extrabold text-slate-900 dark:text-slate-100">
              <span className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {idx + 1}
                </span>
                {step.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 dark:text-slate-400 font-bold">{step.count} candidates</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{step.pct}%</span>
              </div>
            </div>
            <div className="w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-orange-500 dark:to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${step.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
