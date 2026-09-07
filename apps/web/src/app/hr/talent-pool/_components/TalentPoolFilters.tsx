'use client';

import React from 'react';
import { Search, Filter } from '@/lib/lucide-google-icons';

interface TalentPoolFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  selectedSkill: string;
  setSelectedSkill: (val: string) => void;
  minScore: number;
  setMinScore: (val: number) => void;
  allSkills: string[];
}

export function TalentPoolFilters({
  search,
  setSearch,
  selectedSkill,
  setSelectedSkill,
  minScore,
  setMinScore,
  allSkills,
}: TalentPoolFiltersProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search candidates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all font-semibold"
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <select
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
        >
          <option value="All" className="dark:bg-slate-900 dark:text-slate-200">
            All Skills
          </option>
          {allSkills.map((sk) => (
            <option key={sk} value={sk} className="dark:bg-slate-900 dark:text-slate-200">
              {sk}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5 flex flex-col justify-center">
        <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1">
          <span>MIN SCORE</span>
          <span className="text-purple-600 dark:text-purple-400 font-extrabold">{minScore}%</span>
        </div>
        <input
          type="range"
          min="50"
          max="95"
          step="5"
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="w-full accent-purple-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
}
