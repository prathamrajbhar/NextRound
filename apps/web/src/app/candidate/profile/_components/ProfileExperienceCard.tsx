'use client';

import React from 'react';
import { Save } from '@/lib/lucide-google-icons';
import { parseExpectedSalary, convertNumberToIndianWords } from '../_utils/profileUtils';

interface ProfileExperienceCardProps {
  experienceYears: string;
  setExperienceYears: (val: string) => void;
  expectedSalary: string;
  setExpectedSalary: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  saving: boolean;
  onSave: () => void;
}

export function ProfileExperienceCard({
  experienceYears,
  setExperienceYears,
  expectedSalary,
  setExpectedSalary,
  bio,
  setBio,
  saving,
  onSave,
}: ProfileExperienceCardProps) {
  const numericSalary = parseExpectedSalary(expectedSalary);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-800">
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Years of Experience
          </label>
          <input
            type="number"
            min={0}
            max={60}
            placeholder="e.g. 3"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Expected Compensation / Yr
          </label>
          <input
            type="text"
            placeholder="e.g. ₹1,200,000"
            value={expectedSalary}
            onChange={(e) => setExpectedSalary(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
          {numericSalary !== null && (
            <p className="text-[10px] text-brand-650 dark:text-orange-405 font-extrabold tracking-wide mt-1 animate-in fade-in duration-200 uppercase">
              In Words: {convertNumberToIndianWords(numericSalary)}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5 pt-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Professional Bio / Summary
          </label>
          <span className="text-[10px] font-semibold text-slate-400">{bio.length} / 1000 chars</span>
        </div>
        <textarea
          rows={3}
          placeholder="Passionate engineer with expertise in React, TypeScript, and microservice architectures..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input resize-none"
        />
      </div>

      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving Profile...' : 'Save Profile Details'}
        </button>
      </div>
    </>
  );
}
