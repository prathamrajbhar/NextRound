'use client';

import React, { useState } from 'react';
import { IndianRupee, Clock, TrendingUp } from '@/lib/lucide-google-icons';

export function SavingsCalculator() {
  const [monthlyHires, setMonthlyHires] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(45);

  const hoursSavedPerHire = 8;
  const totalHoursSaved = monthlyHires * hoursSavedPerHire;
  const totalMoneySaved = totalHoursSaved * hourlyRate;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-24 w-full text-left">
      <div className="rounded-3xl border border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md p-8 md:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div>
            <span className="text-xs font-black text-brand-600 dark:text-emerald-450 uppercase tracking-widest block">
              ROI calculator
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 tracking-tight">
              See how much time and cost you save.
            </h2>
            <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              HR teams spend an average of 8 hours screening candidates per open role. Calculate your direct savings with HireOS.
            </p>
          </div>

          <div className="space-y-5 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-extrabold text-slate-700 dark:text-slate-350">
                <span>Monthly Hires</span>
                <span className="text-brand-650 dark:text-orange-400 bg-brand-50 dark:bg-orange-950/40 border border-brand-100 dark:border-orange-900/40 px-2 py-0.5 rounded-lg">
                  {monthlyHires} Hires
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={monthlyHires}
                onChange={(e) => setMonthlyHires(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:accent-orange-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-extrabold text-slate-700 dark:text-slate-350">
                <span>Recruiter Hourly Rate</span>
                <span className="text-brand-650 dark:text-orange-400 bg-brand-50 dark:bg-orange-950/40 border border-brand-100 dark:border-orange-900/40 px-2 py-0.5 rounded-lg">
                  ₹{hourlyRate}/hr
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:accent-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-white/60 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-650 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
              <IndianRupee className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Monthly Cost Savings
              </span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-emerald-450 mt-1 block">
                ₹{totalMoneySaved.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/60 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Recruitment Hours Saved
              </span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 mt-1 block">
                {totalHoursSaved} hrs
              </span>
            </div>
          </div>

          <div className="sm:col-span-2 p-5 rounded-2xl border border-brand-200 bg-brand-50/20 dark:border-orange-900/40 dark:bg-orange-950/10 flex items-center gap-3.5">
            <TrendingUp className="h-5 w-5 text-brand-600 dark:text-orange-400 flex-shrink-0" />
            <div className="text-xs">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200">High Return on Investment</h4>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
                Saves an average of {(monthlyHires * 8).toFixed(0)} hours of phone screening time per month. Re-allocate that time to building candidates relations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
