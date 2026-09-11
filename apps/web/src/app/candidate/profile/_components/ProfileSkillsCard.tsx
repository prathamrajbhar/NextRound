'use client';

import React, { useState } from 'react';
import { Sparkles, X, Plus } from '@/lib/lucide-google-icons';
import { PRESET_SKILLS } from '../_utils/profileUtils';

interface ProfileSkillsCardProps {
  skills: string[];
  onAddSkill: (skillName?: string) => void;
  onRemoveSkill: (skillName: string) => void;
}

export function ProfileSkillsCard({ skills, onAddSkill, onRemoveSkill }: ProfileSkillsCardProps) {
  const [newSkill, setNewSkill] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    onAddSkill(newSkill.trim());
    setNewSkill('');
  };

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
      <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
          Skills &amp; AI Vetting Keywords
        </h3>
        <span className="text-[10px] font-extrabold text-slate-400">{skills.length} Skills Added</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-xl bg-brand-50 dark:bg-orange-950/60 border border-brand-200 dark:border-orange-900/60 text-brand-700 dark:text-orange-300 shadow-sm"
          >
            {s}
            <button type="button" onClick={() => onRemoveSkill(s)} className="hover:text-red-500 cursor-pointer">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
        <input
          type="text"
          placeholder="Add skill keyword (e.g. Docker, GraphQL, Python)..."
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          className="flex-grow px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input font-semibold"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>

      <div className="pt-2">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-2">
          Quick Add Suggestions
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SKILLS.filter((ps) => !skills.includes(ps)).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onAddSkill(preset)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-orange-950/40 hover:text-brand-600 dark:hover:text-orange-400 transition-all cursor-pointer border border-slate-200/60 dark:border-slate-800 flex items-center gap-1"
            >
              <Plus className="h-2.5 w-2.5" />
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
