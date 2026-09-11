'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2 } from '@/lib/lucide-google-icons';

interface CandidateVisibilityCardProps {
  visibility: 'Verified' | 'Public' | 'Private';
  setVisibility: (val: 'Verified' | 'Public' | 'Private') => void;
  hideSalary: boolean;
  setHideSalary: (val: boolean) => void;
}

const VISIBILITY_OPTIONS = [
  {
    id: 'Verified' as const,
    title: 'Verified Recruiter Only',
    desc: 'Visible exclusively to vetted employers actively hiring for your target roles.',
  },
  {
    id: 'Public' as const,
    title: 'Public Talent Directory',
    desc: 'Indexed in NextRound candidate index for all registered employers.',
  },
  {
    id: 'Private' as const,
    title: 'Stealth Mode (Private)',
    desc: 'Hidden from discovery. Only visible to jobs you directly apply to.',
  },
];

export function CandidateVisibilityCard({
  visibility,
  setVisibility,
  hideSalary,
  setHideSalary,
}: CandidateVisibilityCardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
          Security &amp; Privacy Controls
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Manage profile discoverability, salary masking, and account credentials
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Profile Visibility Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VISIBILITY_OPTIONS.map((option) => {
            const selected = visibility === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setVisibility(option.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  selected
                    ? 'border-brand-500 dark:border-orange-500 bg-brand-500/10 dark:bg-orange-500/10 ring-2 ring-brand-500/30'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                    {option.title}
                  </span>
                  {selected && <CheckCircle2 className="h-4 w-4 text-brand-500 dark:text-orange-400" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {option.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
            Hide Salary Expectations
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Keep compensation details private until formal offer round
          </span>
        </div>
        <button
          type="button"
          onClick={() => setHideSalary(!hideSalary)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            hideSalary ? 'bg-brand-600 dark:bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              hideSalary ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
