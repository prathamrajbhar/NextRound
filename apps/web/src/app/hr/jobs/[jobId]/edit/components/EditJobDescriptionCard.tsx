'use client';

import React from 'react';
import { Layers } from '@/lib/lucide-google-icons';

interface EditJobDescriptionCardProps {
  description: string;
  setDescription: (val: string) => void;
  skills: string[];
}

export function EditJobDescriptionCard({
  description,
  setDescription,
  skills,
}: EditJobDescriptionCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-indigo-500" />
          Job Description &amp; Scope
        </h3>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Markdown Supported
        </span>
      </div>

      <div>
        <textarea
          required
          rows={10}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 text-xs rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 transition-all font-medium leading-relaxed"
          placeholder="Detail core responsibilities, tech stack expectations, and team goals..."
        />
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          Required Tech Stack Tags
        </span>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, idx) => (
            <span
              key={idx}
              className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 flex items-center gap-1.5"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
