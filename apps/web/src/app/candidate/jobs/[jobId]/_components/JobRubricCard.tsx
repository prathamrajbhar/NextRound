'use client';

import React from 'react';
import { Award } from '@/lib/lucide-google-icons';

interface JobRubricCardProps {
  rubric: {
    technical: number;
    communication: number;
    problemSolving: number;
    experience: number;
  };
}

export function JobRubricCard({ rubric }: JobRubricCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 p-6 md:p-8 shadow-sm backdrop-blur-md glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500 dark:text-amber-400" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display">
            What We Look For
          </h2>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60 uppercase">
          AI Evaluation Rubric
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
        Our automated Evaluation Agent evaluates candidate submissions and interview transcripts across 4 weighted core dimensions:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Technical Knowledge */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-brand-600 dark:text-orange-400 uppercase tracking-wider">
              Technical Knowledge
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
              {rubric.technical}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 dark:bg-orange-500 transition-all duration-500"
              style={{ width: `${rubric.technical}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Syntax proficiency, algorithm efficiency, and architecture design.
          </p>
        </div>

        {/* Communication Skill */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Communication Skill
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
              {rubric.communication}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 dark:bg-purple-400 transition-all duration-500"
              style={{ width: `${rubric.communication}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Clarity of thought, active listening, and structured explanation.
          </p>
        </div>

        {/* Problem Solving */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">
              Problem Solving
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
              {rubric.problemSolving}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-pink-500 dark:bg-pink-400 transition-all duration-500"
              style={{ width: `${rubric.problemSolving}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Deconstruction of ambiguous edge cases and solution trade-offs.
          </p>
        </div>

        {/* Relevant Experience */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Relevant Experience
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
              {rubric.experience}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-500"
              style={{ width: `${rubric.experience}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Domain depth, past production deployments, and leadership background.
          </p>
        </div>
      </div>
    </div>
  );
}
