'use client';

import React, { useState } from 'react';
import { Target, Check } from '@/lib/lucide-google-icons';

interface SetupRoleTargetCardProps {
  targetRole: string;
  setTargetRole: (val: string) => void;
}

const PRESET_ROLES = [
  'Senior Full Stack Engineer',
  'AI Product Engineer',
  'Backend Architect',
  'Frontend Lead',
  'DevOps & Infrastructure Lead',
];

const SUGGESTED_ROLES = [
  'Senior Full Stack Engineer',
  'AI Product Engineer',
  'Backend Architect',
  'Frontend Lead',
  'DevOps & Infrastructure Lead',
  'Software Engineer',
  'React Developer',
  'Node.js Developer',
  'Python Developer',
  'Java Developer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Product Manager',
  'UI/UX Designer',
  'QA Automation Engineer',
  'Cloud Solutions Architect',
  'Security Engineer',
];

export function SetupRoleTargetCard({
  targetRole,
  setTargetRole,
}: SetupRoleTargetCardProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = SUGGESTED_ROLES.filter(
    (r) =>
      r.toLowerCase().includes(targetRole.toLowerCase()) &&
      r.toLowerCase() !== targetRole.toLowerCase()
  );

  return (
    <div className="relative z-20 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-900/30 backdrop-blur-md p-6 shadow-md space-y-5">
      <h2 className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
        <Target className="h-4.5 w-4.5 text-orange-500 dark:text-orange-400" />
        Target Position &amp; Role Focus
      </h2>

      <div className="space-y-2">
        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
          Target Job Title
        </label>
        <div className="relative">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => {
              setTargetRole(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder="Enter job position (e.g. Senior Full Stack Engineer)..."
            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-950/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-semibold focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-inner"
          />

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg py-1">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setTargetRole(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          Popular Positions
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_ROLES.map((role) => {
            const isSelected = targetRole === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setTargetRole(role)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-950/70 dark:border-white/5 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
                {role}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
