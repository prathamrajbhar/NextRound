'use client';

import React from 'react';
import { Award } from '@/lib/lucide-google-icons';

interface SkillsScorecardProps {
  scores?: {
    technical: number;
    communication: number;
    problemSolving: number;
    experience: number;
  };
}

export default function SkillsScorecard({ scores }: SkillsScorecardProps) {
  if (!scores) return null;

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-md glass-panel space-y-4">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2 flex items-center gap-2">
        <Award className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
        Skills Scorecard
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { name: 'Technical Knowledge', val: scores.technical },
          { name: 'Communication Logic', val: scores.communication },
          { name: 'Problem Solving', val: scores.problemSolving },
          { name: 'Experience Match', val: scores.experience },
        ].map((s) => (
          <div key={s.name} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
              <span>{s.name}</span>
              <span className="text-brand-600 dark:text-orange-400 font-bold">{s.val}%</span>
            </div>
            <div className="w-full bg-slate-200/50 dark:bg-slate-800/60 rounded-full h-1.5">
              <div className="bg-brand-600 dark:bg-orange-400 h-1.5 rounded-full" style={{ width: `${s.val}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
