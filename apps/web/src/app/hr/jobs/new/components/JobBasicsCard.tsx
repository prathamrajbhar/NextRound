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
    <div className="rounded-3xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-md glass-panel space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <Briefcase className="h-4.5 w-4.5 text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-800">Job Basics</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-500 block mb-1">Position Title</label>
          <Autocomplete
            required
            options={SUGGESTED_ROLES}
            value={title}
            onChange={(val) => setTitle(val)}
            placeholder="e.g. Senior Fullstack Engineer (React & Go)"
            icon={<Briefcase className="h-4 w-4" />}
            className="text-xs font-semibold"
          />
        </div>

        {/* Department */}
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
          >
            <option value="Engineering">Engineering</option>
            <option value="Product Management">Product Management</option>
            <option value="Design">Design</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        {/* Location Type */}
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Location Type</label>
          <select
            value={locationType}
            onChange={(e) => setLocationType(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
          >
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>
        </div>

        {/* Experience Level */}
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Seniority Level</label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
          >
            <option value="Entry-Level">Entry-Level</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior (5+ Years)">Senior (5+ Years)</option>
            <option value="Lead / Principal">Lead / Principal</option>
          </select>
        </div>

        {/* Salary Range */}
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Annual Salary Range (USD)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minSalary}
              onChange={(e) => setMinSalary(Number(e.target.value))}
              placeholder="Min"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
            />
            <span className="text-xs text-slate-400 font-bold">-</span>
            <input
              type="number"
              value={maxSalary}
              onChange={(e) => setMaxSalary(Number(e.target.value))}
              placeholder="Max"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all glass-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
