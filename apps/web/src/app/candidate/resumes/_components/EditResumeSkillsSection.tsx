'use client';

import React, { useState } from 'react';
import { X, Plus } from '@/lib/lucide-google-icons';

interface EditResumeSkillsSectionProps {
  skills: string[];
  setSkills: (skills: string[]) => void;
}

export function EditResumeSkillsSection({ skills, setSkills }: EditResumeSkillsSectionProps) {
  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (tag: string) => {
    setSkills(skills.filter((s) => s !== tag));
  };

  return (
    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
        Extracted Skills Matrix
      </label>
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-xl bg-brand-50 dark:bg-orange-950/60 border border-brand-200 dark:border-orange-900/60 text-brand-700 dark:text-orange-300"
          >
            {s}
            <button
              type="button"
              onClick={() => handleRemoveSkill(s)}
              className="hover:text-red-500 cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <input
          type="text"
          placeholder="Add skill (e.g. Redis, Kubernetes)..."
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddSkill();
            }
          }}
          className="flex-grow px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAddSkill}
          className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-extrabold cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
