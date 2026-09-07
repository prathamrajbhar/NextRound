'use client';

import React from 'react';
import { AlertCircle } from '@/lib/lucide-google-icons';

interface DropoffItem {
  stage: string;
  percentage: number;
  dropCount: number;
}

interface DropoffAnalysisCardProps {
  dropoffAnalysis?: DropoffItem[];
}

export function DropoffAnalysisCard({ dropoffAnalysis }: DropoffAnalysisCardProps) {
  const items = dropoffAnalysis || [];

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
      <div className="border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
          Where Candidates Drop Off
        </h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          Main reasons candidates do not advance to the next step.
        </p>
      </div>

      <div className="space-y-3.5 text-xs font-semibold">
        {items.length > 0 ? (
          items.map((item, idx: number) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 space-y-1"
            >
              <div className="flex justify-between items-center text-amber-800 dark:text-amber-300 font-extrabold">
                <span>{item.stage}</span>
                <span>{item.percentage}% Drop</span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                {item.dropCount} candidates dropped at this stage.
              </p>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-xs text-slate-400 font-medium">
            No candidate drop-off data available yet.
          </div>
        )}
      </div>
    </div>
  );
}
