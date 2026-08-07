'use client';

import React, { useState } from 'react';
import { Gift, Wallet, Award, TrendingUp, Sparkles, HelpCircle } from 'lucide-react';

interface CompensationProps {
  baseSalary: string;
  bonus: string;
  equity: string;
}

export function CompensationBreakdown({ baseSalary, bonus, equity }: CompensationProps) {
  const [isMonthly, setIsMonthly] = useState(false);

  // Helper to extract numerical salary for monthly estimation
  const parseLakhs = (valStr: string) => {
    const match = valStr.match(/₹?(\d+(\.\d+)?)L/i);
    return match ? parseFloat(match[1]) : 0;
  };

  const lakhVal = parseLakhs(baseSalary);
  const monthlyInr = Math.round((lakhVal * 100000) / 12);
  const formattedMonthly = `₹${(monthlyInr / 100000).toFixed(2)}L/mo (~₹${monthlyInr.toLocaleString('en-IN')})`;

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-7 shadow-xl backdrop-blur-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Compensation Structure
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Guaranteed base salary, variable bonus, and equity vesting
            </p>
          </div>
        </div>

        {/* Annual / Monthly toggle */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsMonthly(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isMonthly
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Annual View
          </button>
          <button
            type="button"
            onClick={() => setIsMonthly(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isMonthly
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Monthly View
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Base Salary */}
        <div className="group rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 p-5 hover:border-brand-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Wallet className="h-4 w-4 text-brand-500" />
              Base Salary
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              Fixed
            </span>
          </div>
          <div className="space-y-1 mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white block tracking-tight">
              {isMonthly ? formattedMonthly : baseSalary}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              {isMonthly ? 'Estimated pre-tax monthly' : 'Annual Base CTC'}
            </span>
          </div>
        </div>

        {/* Card 2: Target Bonus */}
        <div className="group rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 p-5 hover:border-emerald-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Award className="h-4 w-4 text-emerald-500" />
              Performance Bonus
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Variable
            </span>
          </div>
          <div className="space-y-1 mt-3">
            <span className="text-base font-extrabold text-slate-900 dark:text-white block line-clamp-2">
              {bonus}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Based on individual & team KPIs
            </span>
          </div>
        </div>

        {/* Card 3: Stock Options */}
        <div className="group rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 p-5 hover:border-amber-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              Stock Options
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Equity
            </span>
          </div>
          <div className="space-y-1 mt-3">
            <span className="text-base font-extrabold text-slate-900 dark:text-white block line-clamp-2">
              {equity}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Long-term growth incentive
            </span>
          </div>
        </div>
      </div>

      {/* Visual Component Bar Ratio */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            Compensation Distribution
          </span>
          <span className="text-slate-400 dark:text-slate-500 font-semibold">Base • Variable</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden p-0.5 gap-1 border border-slate-200 dark:border-slate-700">
          <div className="h-full rounded-full bg-brand-500 flex-1" title="Base Salary" />
          <div className="h-full rounded-full bg-emerald-500 flex-1" title="Variable Bonus" />
        </div>
      </div>
    </div>
  );
}
