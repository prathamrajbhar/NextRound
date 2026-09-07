'use client';

import React from 'react';
import { Plus, Trash2 } from '@/lib/lucide-google-icons';
import type { GeneratedResumeData } from './resume.types';

interface EditResumeExperienceSectionProps {
  experiences: NonNullable<GeneratedResumeData['experience']>;
  setExperiences: (experiences: NonNullable<GeneratedResumeData['experience']>) => void;
}

export function EditResumeExperienceSection({
  experiences,
  setExperiences,
}: EditResumeExperienceSectionProps) {
  const handleAddHighlight = (expIdx: number) => {
    const updated = [...experiences];
    const exp = updated[expIdx];
    if (exp) {
      if (!exp.highlights) exp.highlights = [];
      exp.highlights.push('New key achievement or technical bullet point...');
      setExperiences(updated);
    }
  };

  const handleUpdateHighlight = (expIdx: number, hIdx: number, val: string) => {
    const updated = [...experiences];
    const exp = updated[expIdx];
    if (exp && exp.highlights) {
      exp.highlights[hIdx] = val;
      setExperiences(updated);
    }
  };

  const handleRemoveHighlight = (expIdx: number, hIdx: number) => {
    const updated = [...experiences];
    const exp = updated[expIdx];
    if (exp && exp.highlights) {
      exp.highlights.splice(hIdx, 1);
      setExperiences(updated);
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
        Work Experience &amp; Accomplishments
      </label>
      {experiences.map((exp, expIdx) => (
        <div
          key={expIdx}
          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">
              {exp.title || 'Role'} • {exp.company || 'Company'}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">{exp.duration || ''}</span>
          </div>

          <div className="space-y-2">
            {(exp.highlights || []).map((h: string, hIdx: number) => (
              <div key={hIdx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={h}
                  onChange={(e) => handleUpdateHighlight(expIdx, hIdx, e.target.value)}
                  className="flex-grow px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveHighlight(expIdx, hIdx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddHighlight(expIdx)}
              className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
            >
              <Plus className="h-3 w-3" /> Add Bullet Highlight
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
