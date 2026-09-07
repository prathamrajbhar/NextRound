'use client';

import React from 'react';
import { Application } from '@/types';

interface CandidateDrawerScorecardTabProps {
  app: Application;
}

export function CandidateDrawerScorecardTab({ app }: CandidateDrawerScorecardTabProps) {
  return (
    <div className="space-y-4">
      {app.scores && (
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 dark:border-slate-800 pb-2">
            Evaluation Category Breakdown
          </span>
          <div className="space-y-3.5 pt-1">
            <div>
              <div className="flex justify-between font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                <span>Technical Architecture</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{app.scores.technical}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${app.scores.technical}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                <span>Communication Pacing</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">{app.scores.communication}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${app.scores.communication}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                <span>Problem Solving Logic</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{app.scores.problemSolving}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${app.scores.problemSolving}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                <span>Relevant Experience</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{app.scores.experience}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${app.scores.experience}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
          AI Evaluator Reasoning
        </span>
        <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold leading-relaxed italic border-l-2 border-brand-500 pl-3 py-1 bg-white/60 dark:bg-slate-900/60 rounded-r-xl">
          {app.reasoning
            ? `"${app.reasoning}"`
            : 'No evaluator reasoning is available for this candidate yet.'}
        </p>
      </div>
    </div>
  );
}
