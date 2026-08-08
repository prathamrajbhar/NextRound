'use client';

import React from 'react';
import { Briefcase } from 'lucide-react';
import { Autocomplete } from '@/components/ui';
import { SUGGESTED_ROLES } from '@/lib/constants';

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
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Briefcase className="h-5 w-5" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Job Details</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Title */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            Job Title <span className="text-rose-500">*</span>
          </label>
          <Autocomplete
            required
            options={SUGGESTED_ROLES}
            value={title}
            onChange={(val) => setTitle(val)}
            placeholder="e.g. Senior Fullstack Engineer"
            icon={<Briefcase className="h-4 w-4" />}
            className="text-xs font-semibold"
          />
        </div>

        {/* Department */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all glass-input"
          >
            <option value="Engineering" className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">Engineering</option>
            <option value="Product Management" className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">Product Management</option>
            <option value="Design" className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">Design</option>
            <option value="Sales & Marketing" className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">Sales & Marketing</option>
            <option value="Operations" className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">Operations</option>
          </select>
        </div>

        {/* Location Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            Work Location
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            {['Remote', 'Hybrid', 'On-site'].map((loc) => {
              const active = locationType === loc;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocationType(loc)}
                  className={`py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer text-center ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        </div>

        {/* Experience Level */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            Experience Level
          </label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all glass-input"
          >
            <option value="Entry-Level" className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">Entry-Level</option>
            <option value="Mid-Level" className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">Mid-Level</option>
            <option value="Senior (5+ Years)" className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">Senior (5+ Years)</option>
            <option value="Lead / Principal" className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">Lead / Principal</option>
          </select>
        </div>

        {/* Salary Range */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              Salary Range (USD)
            </label>
            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
              ${(minSalary / 1000).toFixed(0)}k - ${(maxSalary / 1000).toFixed(0)}k / year
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                placeholder="Min"
                className="w-full pl-7 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all glass-input"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold dark:text-slate-500">-</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                value={maxSalary}
                onChange={(e) => setMaxSalary(Number(e.target.value))}
                placeholder="Max"
                className="w-full pl-7 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all glass-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
