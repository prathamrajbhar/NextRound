'use client';

import React from 'react';
import { Plus, X, Sparkles } from '@/lib/lucide-google-icons';

interface HiringSpecialtiesCardProps {
  specialties: string[];
  newSpecialty: string;
  setNewSpecialty: (val: string) => void;
  onAddSpecialty: (e: React.FormEvent) => void;
  onRemoveSpecialty: (tag: string) => void;
}

export function HiringSpecialtiesCard({
  specialties,
  newSpecialty,
  setNewSpecialty,
  onAddSpecialty,
  onRemoveSpecialty,
}: HiringSpecialtiesCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 flex items-center gap-1.5">
        <Sparkles className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400 animate-pulse" />
        Focus Hiring Specialties
      </h3>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {specialties.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60 text-purple-700 dark:text-purple-300 shadow-sm"
          >
            {s}
            <button
              type="button"
              onClick={() => onRemoveSpecialty(s)}
              className="hover:text-purple-950 dark:hover:text-white cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <form onSubmit={onAddSpecialty} className="flex gap-2">
        <input
          type="text"
          placeholder="Add specialty tag (e.g. Sales, Frontend)..."
          value={newSpecialty}
          onChange={(e) => setNewSpecialty(e.target.value)}
          className="flex-grow px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-purple-500 transition-all font-semibold"
        />
        <button
          type="submit"
          className="rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xs px-4 hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center shadow-md"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
