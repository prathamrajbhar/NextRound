'use client';

import React from 'react';
import { Award } from '@/lib/lucide-google-icons';

interface Scores {
  composite: number;
  technical: number;
  communication: number;
  problemSolving: number;
  experience: number;
}

interface CandidateScorecardProps {
  scores: Scores;
}

export function CandidateScorecard({ scores }: CandidateScorecardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 p-6 md:p-8 shadow-sm backdrop-blur-md glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-500" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display">
            AI Evaluation Scorecard
          </h3>
        </div>
        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/60">
          Overall Composite: {scores.composite}%
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-300">Technical Qualification</span>
            <span className="text-brand-600 dark:text-orange-400">{scores.technical}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 dark:bg-orange-500"
              style={{ width: `${scores.technical}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-300">Communication & Articulation</span>
            <span className="text-purple-600 dark:text-purple-400">{scores.communication}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 dark:bg-purple-400"
              style={{ width: `${scores.communication}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-300">Problem Solving & Logic</span>
            <span className="text-pink-600 dark:text-pink-400">{scores.problemSolving}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-pink-500 dark:bg-pink-400"
              style={{ width: `${scores.problemSolving}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-300">Experience Alignment</span>
            <span className="text-emerald-600 dark:text-emerald-400">{scores.experience}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
              style={{ width: `${scores.experience}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
