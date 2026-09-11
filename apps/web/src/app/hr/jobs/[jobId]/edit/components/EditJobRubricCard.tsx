'use client';

import React from 'react';
import { Sliders } from '@/lib/lucide-google-icons';

interface EditJobRubricCardProps {
  techWeight: number;
  commWeight: number;
  probWeight: number;
  expWeight: number;
  totalWeight: number;
  isRubricBalanced: boolean;
  onWeightChange: (key: 'tech' | 'comm' | 'prob' | 'exp', val: number) => void;
}

export function EditJobRubricCard({
  techWeight,
  commWeight,
  probWeight,
  expWeight,
  totalWeight,
  isRubricBalanced,
  onWeightChange,
}: EditJobRubricCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
            AI Evaluation Rubric Weights
          </h3>
        </div>
        <span
          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
            isRubricBalanced
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
          }`}
        >
          Total: {totalWeight}% {isRubricBalanced ? '(Balanced)' : '(Must Equal 100%)'}
        </span>
      </div>

      <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <div>
          <div className="flex justify-between mb-1 text-[11px] font-bold">
            <span>Technical Skills</span>
            <span className="text-brand-600 dark:text-orange-400 font-extrabold">{techWeight}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={techWeight}
            onChange={(e) => onWeightChange('tech', Number(e.target.value))}
            className="w-full accent-brand-600 dark:accent-orange-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1 text-[11px] font-bold">
            <span>Communication</span>
            <span className="text-purple-600 dark:text-purple-400 font-extrabold">{commWeight}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={commWeight}
            onChange={(e) => onWeightChange('comm', Number(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1 text-[11px] font-bold">
            <span>Problem Solving</span>
            <span className="text-pink-600 dark:text-pink-400 font-extrabold">{probWeight}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={probWeight}
            onChange={(e) => onWeightChange('prob', Number(e.target.value))}
            className="w-full accent-pink-600 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1 text-[11px] font-bold">
            <span>Relevant Experience</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{expWeight}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={expWeight}
            onChange={(e) => onWeightChange('exp', Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
