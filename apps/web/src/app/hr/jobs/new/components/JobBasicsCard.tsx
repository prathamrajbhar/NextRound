'use client';

import React from 'react';
import { Briefcase, Building2, MapPin, Layers, IndianRupee } from '@/lib/lucide-google-icons';
import { Autocomplete } from '@/components/ui';
import { SUGGESTED_ROLES } from '@/lib/suggestedOptions';

interface JobBasicsProps {
  title: string;
  setTitle: (val: string) => void;
  department: string;
  setDepartment: (val: string) => void;
  locationType: string;
  setLocationType: (val: string) => void;
  experienceLevel: string;
  setExperienceLevel: (val: string) => void;
  minSalary: number;
  setMinSalary: (val: number) => void;
  maxSalary: number;
  setMaxSalary: (val: number) => void;
}

const DEPARTMENTS = [
  'Engineering',
  'Product Management',
  'Design & UX',
  'Data & AI',
  'Sales & Marketing',
  'Operations & People',
];

const EXPERIENCE_LEVELS = [
  'Entry-Level (0-2 Yrs)',
  'Mid-Level (2-5 Yrs)',
  'Senior (5-8 Yrs)',
  'Lead / Staff (8+ Yrs)',
  'Director / VP',
];

export default function JobBasicsCard({
  title,
  setTitle,
  department,
  setDepartment,
  locationType,
  setLocationType,
  experienceLevel,
  setExperienceLevel,
  minSalary,
  setMinSalary,
  maxSalary,
  setMaxSalary,
}: JobBasicsProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-6 md:p-7 shadow-sm backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5 text-brand-600 dark:text-brand-400">
          <div className="h-8 w-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">Role Overview &amp; Compensation</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Core position details and baseline specifications</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>Job Title</span>
            <span className="text-rose-500 font-bold">*</span>
          </label>
          <Autocomplete
            required
            options={SUGGESTED_ROLES}
            value={title}
            onChange={(val) => setTitle(val)}
            placeholder="e.g. Senior Fullstack Engineer"
            icon={<Briefcase className="h-4 w-4 text-slate-400" />}
            className="text-xs font-semibold py-2.5 rounded-xl border-slate-200 dark:border-slate-700 focus:border-brand-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span>Department</span>
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept} className="dark:bg-slate-900">
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>Experience Level</span>
          </label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
          >
            {EXPERIENCE_LEVELS.map((exp) => (
              <option key={exp} value={exp} className="dark:bg-slate-900">
                {exp}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span>Work Location Model</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60">
            {['Remote', 'Hybrid', 'On-site'].map((loc) => {
              const active = locationType === loc;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocationType(loc)}
                  className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                    active
                      ? 'bg-brand-600 dark:bg-brand-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
              <span>Annual Compensation (LPA)</span>
            </label>
            <span className="text-[11px] font-extrabold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-lg">
              ₹{(minSalary / 100000).toFixed(1)}L - ₹{(maxSalary / 100000).toFixed(1)}L
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="50000"
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                placeholder="Min Salary"
                className="w-full pl-7 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold dark:text-slate-500">to</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="50000"
                value={maxSalary}
                onChange={(e) => setMaxSalary(Number(e.target.value))}
                placeholder="Max Salary"
                className="w-full pl-7 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
