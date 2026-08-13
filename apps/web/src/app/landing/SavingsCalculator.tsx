'use client';

import React, { useState } from 'react';
import { DollarSign, Clock, TrendingUp } from '@/lib/lucide-google-icons';

export function SavingsCalculator() {
  const [hiresPerMonth, setHiresPerMonth] = useState(5);
  const [recruiterRate, setRecruiterRate] = useState(50);

  // Traditional screening: 8 hours per hire.
  // HireOS screening: 0.75 hours per hire.
  const hoursSavedPerHire = 7.25;

  const totalHoursSaved = Math.round(hiresPerMonth * hoursSavedPerHire);
  const totalMoneySaved = Math.round(totalHoursSaved * recruiterRate);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-24 w-full text-left">
      <div className="rounded-3xl border border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md shadow-xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        
        {/* Left column: Controls */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-black text-brand-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
              ROI Estimator
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Calculate your time and cost savings
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              Replacing manual first-round phone screens with automated voice assessments significantly reduces your cost-per-hire.
            </p>
          </div>

          <div className="space-y-5 pt-4">
            {/* Control 1: Monthly hires */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-extrabold text-slate-700 dark:text-slate-300">
                <span>Estimated Hires per Month</span>
                <span className="bg-brand-50 dark:bg-slate-950/60 text-brand-700 dark:text-emerald-400 px-3 py-1 rounded-xl border border-brand-100 dark:border-slate-800">
                  {hiresPerMonth} hires
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={hiresPerMonth}
                onChange={(e) => setHiresPerMonth(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:accent-orange-500"
              />
            </div>

            {/* Control 2: Hourly Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-extrabold text-slate-700 dark:text-slate-300">
                <span>Recruiter Hourly Rate (USD)</span>
                <span className="bg-brand-50 dark:bg-slate-950/60 text-brand-700 dark:text-emerald-400 px-3 py-1 rounded-xl border border-brand-100 dark:border-slate-800">
                  ${recruiterRate}/hr
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={recruiterRate}
                onChange={(e) => setRecruiterRate(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-605 dark:accent-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Right column: Results display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Result 1: Cost saved */}
          <div className="p-6 rounded-2xl border border-white/60 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-650 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Monthly Cost Savings
              </span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-emerald-400 mt-1 block">
                ${totalMoneySaved.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Result 2: Hours saved */}
          <div className="p-6 rounded-2xl border border-white/60 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Recruitment Hours Saved
              </span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 mt-1 block">
                {totalHoursSaved} hrs
              </span>
            </div>
          </div>

          {/* Result 3: ROI Banner (col-span 2) */}
          <div className="sm:col-span-2 p-5 rounded-2xl border border-brand-200 bg-brand-50/20 dark:border-orange-900/40 dark:bg-orange-950/10 flex items-center gap-3.5">
            <TrendingUp className="h-5 w-5 text-brand-600 dark:text-orange-400 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-extrabold text-slate-800 dark:text-slate-200">Accelerated Hiring Speed</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                By delegating initial screens to AI voice recruiters, teams reduce candidate turnaround times to just 72 hours.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
