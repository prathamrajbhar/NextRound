'use client';

import React from 'react';
import { Award } from '@/lib/lucide-google-icons';

interface JobRubricCardProps {
  rubric: Record<string, { weight: number; description: string }> | {
    technical: number;
    communication: number;
    problemSolving: number;
    experience: number;
  };
}

export function JobRubricCard({ rubric }: JobRubricCardProps) {
  if (!rubric || typeof rubric !== 'object') return null;

  let displayRubric: Record<string, { weight: number; description: string }> = {};

  const keys = Object.keys(rubric);
  if (keys.length > 0 && typeof rubric[keys[0] as keyof typeof rubric] === 'number') {
    const r = rubric as { technical: number; communication: number; problemSolving: number; experience: number };
    displayRubric = {
      technicalSkills: { weight: r.technical || 0, description: 'Coding correctness, logic efficiency, and database query modeling.' },
      communication: { weight: r.communication || 0, description: 'Verbal articulation, speech pacing, logic structure, and vocabulary.' },
      systemDesign: { weight: r.problemSolving || 0, description: 'High-level architecture, scalability planning, and fault tolerance.' },
      cultureFit: { weight: r.experience || 0, description: 'Work experience history, behavioral STAR answers, and cultural alignment.' }
    };
  } else {
    displayRubric = rubric as Record<string, { weight: number; description: string }>;
  }

  const getTitle = (key: string) => {
    switch (key) {
      case 'technicalSkills': return 'Technical Skills';
      case 'systemDesign': return 'System Design';
      case 'communication': return 'Communication Skill';
      case 'cultureFit': return 'Culture Fit';
      default: return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
    }
  };

  const getColor = (key: string) => {
    switch (key) {
      case 'technicalSkills': return { text: 'text-brand-600 dark:text-orange-400', bar: 'bg-brand-500 dark:bg-orange-500' };
      case 'systemDesign': return { text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500 dark:bg-blue-400' };
      case 'communication': return { text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500 dark:bg-purple-400' };
      case 'cultureFit': return { text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500 dark:bg-emerald-400' };
      default: return { text: 'text-slate-600 dark:text-slate-400', bar: 'bg-slate-500 dark:bg-slate-400' };
    }
  };

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
        Our automated Evaluation Agent evaluates candidate submissions and interview transcripts across the weighted core dimensions:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(displayRubric).map(([key, val]) => {
          if (!val || typeof val !== 'object') return null;
          const { weight, description } = val;
          const pct = weight <= 1 ? Math.round(weight * 100) : Math.round(weight);
          const color = getColor(key);
          return (
            <div key={key} className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold ${color.text} uppercase tracking-wider`}>
                  {getTitle(key)}
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                  {pct}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full ${color.bar} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
