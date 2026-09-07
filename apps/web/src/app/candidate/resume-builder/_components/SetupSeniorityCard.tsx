'use client';

import React from 'react';
import { Layers, CheckCircle2 } from '@/lib/lucide-google-icons';

interface SetupSeniorityCardProps {
  experienceLevel: string;
  setExperienceLevel: (val: string) => void;
}

const EXPERIENCE_OPTIONS = [
  { id: 'Fresher (0-2 Years)', label: 'Fresher / Entry-Level', sub: '0–2 Yrs Exp' },
  { id: 'Mid-Level (2-5 Years)', label: 'Mid-Level', sub: '2–5 Yrs Exp' },
  { id: 'Senior (5+ Years)', label: 'Senior Specialist', sub: '5–8 Yrs Exp' },
  { id: 'Staff / Lead (8+ Years)', label: 'Staff / Tech Lead', sub: '8+ Yrs Exp' },
];

export function SetupSeniorityCard({
  experienceLevel,
  setExperienceLevel,
}: SetupSeniorityCardProps) {
  return (
    <div className="relative z-10 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-900/30 backdrop-blur-md p-6 shadow-md space-y-5">
      <h2 className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
        <Layers className="h-4.5 w-4.5 text-orange-500 dark:text-orange-400" />
        Seniority &amp; Domain Focus
      </h2>

      <div className="space-y-2">
        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
          Target Experience Level
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {EXPERIENCE_OPTIONS.map((exp) => {
            const selected = experienceLevel === exp.id;
            return (
              <button
                key={exp.id}
                type="button"
                onClick={() => setExperienceLevel(exp.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                  selected
                    ? 'border-orange-500 bg-orange-500/5 dark:bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                    : 'border-slate-200 bg-slate-100 hover:border-slate-350 dark:border-white/5 dark:bg-slate-950/80 dark:hover:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {exp.label}
                  </span>
                  {selected && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />
                  )}
                </div>
                <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                  {exp.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
