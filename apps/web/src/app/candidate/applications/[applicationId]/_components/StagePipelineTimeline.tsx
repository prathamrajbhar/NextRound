'use client';

import React from 'react';
import { Layers, Check, ChevronRight, Sparkles, ClipboardCheck, Video, Calendar, Gift, FileText } from '@/lib/lucide-google-icons';

export interface StageItem {
  name: string;
  desc: string;
  date: string;
  done: boolean;
  active?: boolean;
}

interface StagePipelineTimelineProps {
  stages: StageItem[];
  onSelectStage?: (stageIndex: number) => void;
}

export function StagePipelineTimeline({ stages, onSelectStage }: StagePipelineTimelineProps) {
  const completedCount = stages.filter((s) => s.done).length;

  const stageIcons = [FileText, Sparkles, ClipboardCheck, Video, Calendar, Gift];

  const stageActionLabels = [
    'View Submission',
    'View AI Scorecard',
    'Launch Assessment',
    'Start AI Interview',
    'Schedule HR Round',
    'Review Offer',
  ];

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 md:p-8 shadow-sm backdrop-blur-md glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          Stage Pipeline
        </h2>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
          Stage {completedCount} of {stages.length} Completed
        </span>
      </div>

      <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {stages.map((st, idx) => {
          const IconComponent = stageIcons[idx] || Layers;
          const actionLabel = stageActionLabels[idx] || 'View Stage';
          const isCurrentActive = !st.done && (idx === 0 || stages[idx - 1]?.done);

          return (
            <div
              key={idx}
              onClick={() => onSelectStage && onSelectStage(idx)}
              className={`group flex items-start gap-4 relative z-10 p-3.5 rounded-2xl transition-all cursor-pointer border ${
                isCurrentActive
                  ? 'bg-brand-50/40 dark:bg-slate-800/80 border-brand-200 dark:border-slate-700 shadow-xs'
                  : st.done
                  ? 'bg-slate-50/50 dark:bg-slate-900/40 border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  : 'bg-transparent border-transparent hover:border-slate-200/60 dark:hover:border-slate-800/60'
              }`}
            >
              {/* Stage Step Badge */}
              <div
                className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-extrabold text-xs shadow-2xs transition-all flex-shrink-0 mt-0.5 ${
                  st.done
                    ? 'bg-emerald-500 border-emerald-600 dark:bg-emerald-600 dark:border-emerald-500 text-white'
                    : isCurrentActive
                    ? 'bg-brand-600 dark:bg-orange-500 border-brand-700 dark:border-orange-600 text-white animate-pulse'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {st.done ? <Check className="h-4 w-4 stroke-[3]" /> : idx + 1}
              </div>

              {/* Stage Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <IconComponent
                      className={`h-4 w-4 ${
                        st.done
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isCurrentActive
                          ? 'text-brand-600 dark:text-orange-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <h4
                      className={`text-sm font-extrabold font-display ${
                        st.done || isCurrentActive
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {st.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {st.done && Boolean(st.date) && (
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
                        {st.date}
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                        st.done
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : isCurrentActive
                          ? 'bg-brand-100 dark:bg-orange-950/80 text-brand-700 dark:text-orange-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {st.done ? 'Completed' : isCurrentActive ? 'In Progress' : 'Upcoming'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal leading-relaxed">
                  {st.desc}
                </p>

                {/* Stage CTA Button */}
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-orange-400 group-hover:underline">
                  <span>{actionLabel}</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
