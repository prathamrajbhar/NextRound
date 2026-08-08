'use client';

import React from 'react';
import { Layers, Check } from '@/lib/lucide-google-icons';

interface Stage {
  name: string;
  desc: string;
  date: string;
  done: boolean;
}

interface StagePipelineTimelineProps {
  stages: Stage[];
}

export function StagePipelineTimeline({ stages }: StagePipelineTimelineProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 p-6 md:p-8 shadow-sm backdrop-blur-md glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          Stage Pipeline
        </h2>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Stage {stages.filter((s) => s.done).length} of {stages.length} Completed
        </span>
      </div>

      <div className="space-y-8 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200/80 dark:before:bg-slate-800">
        {stages.map((st, idx) => (
          <div key={idx} className="flex items-start gap-4 relative z-10">
            <div
              className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-extrabold text-xs shadow-2xs transition-all flex-shrink-0 ${
                st.done
                  ? 'bg-emerald-500 border-emerald-600 dark:bg-emerald-600 dark:border-emerald-500 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
              }`}
            >
              {st.done ? <Check className="h-4 w-4 stroke-[3]" /> : idx + 1}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <h4
                  className={`text-sm font-extrabold font-display ${
                    st.done ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {st.name}
                </h4>
                {st.done && Boolean(st.date) && (
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    {st.date}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal leading-relaxed">
                {st.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
