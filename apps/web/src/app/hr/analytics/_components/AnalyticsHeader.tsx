'use client';

import React from 'react';
import { Download } from '@/lib/lucide-google-icons';

interface AnalyticsHeaderProps {
  timeframe: '30d' | '90d' | 'ytd';
  setTimeframe: (val: '30d' | '90d' | 'ytd') => void;
  department: string;
  setDepartment: (val: string) => void;
  onExportCSV: () => void;
}

export function AnalyticsHeader({
  timeframe,
  setTimeframe,
  department,
  setDepartment,
  onExportCSV,
}: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
      <div>
        <span className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 uppercase tracking-widest block mb-1">
          HR Console
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
          Hiring Analytics &amp; Reports
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Track hiring speed, applicant results, candidate ratings, and drop-off points.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 select-none">
          {(['30d', '90d', 'ytd'] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tf === '30d' ? '30 Days' : tf === '90d' ? '90 Days' : 'Year to Date'}
            </button>
          ))}
        </div>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="all">All Departments</option>
          <option value="engineering">Engineering</option>
          <option value="product">Product Management</option>
          <option value="design">UI/UX Design</option>
        </select>

        <button
          type="button"
          onClick={onExportCSV}
          className="inline-flex items-center gap-1.5 bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Report</span>
        </button>
      </div>
    </div>
  );
}
