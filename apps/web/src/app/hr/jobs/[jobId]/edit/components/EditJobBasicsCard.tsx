'use client';

import React from 'react';
import { Building2, Briefcase, MapPin, IndianRupee } from '@/lib/lucide-google-icons';
import { Autocomplete } from '@/components/ui';
import { SUGGESTED_ROLES } from '@/lib/suggestedOptions';

interface EditJobBasicsCardProps {
  title: string;
  setTitle: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  salary: string;
  setSalary: (val: string) => void;
  experienceLevel: string;
  setExperienceLevel: (val: string) => void;
  status: 'active' | 'draft' | 'closed';
  setStatus: (val: 'active' | 'draft' | 'closed') => void;
}

export function EditJobBasicsCard({
  title,
  setTitle,
  location,
  setLocation,
  salary,
  setSalary,
  experienceLevel,
  setExperienceLevel,
  status,
  setStatus,
}: EditJobBasicsCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <Building2 className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
          Position Basics &amp; Meta
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Position Title
          </label>
          <Autocomplete
            required
            options={SUGGESTED_ROLES}
            value={title}
            onChange={(val) => setTitle(val)}
            icon={<Briefcase className="h-4 w-4 text-slate-400" />}
            className="text-xs font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Location
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50">
              <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                placeholder="e.g. Remote (Worldwide)"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Salary Range
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50">
              <IndianRupee className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                required
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                placeholder="e.g. ₹12 LPA - ₹18 LPA"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Experience Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Entry-Level">Entry-Level (0-2 Yrs)</option>
              <option value="Mid-Level">Mid-Level (2-5 Yrs)</option>
              <option value="Senior (5+ Years)">Senior (5+ Years)</option>
              <option value="Lead / Principal">Lead / Principal (8+ Yrs)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Job Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'draft' | 'closed')}
              className="w-full p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="active">Active (Published)</option>
              <option value="draft">Draft (Unpublished)</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
