'use client';

import React, { useState } from 'react';
import { Wallet, Award, TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface TotalRewardsProps {
  baseSalary: string;
  bonus: string;
  equity: string;
  benefits: string[];
}

export function TotalRewardsOverview({
  baseSalary,
  bonus,
  equity,
  benefits,
}: TotalRewardsProps) {
  const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');

  const parseLakhs = (valStr: string) => {
    const match = valStr.match(/₹?(\d+(\.\d+)?)L/i);
    return match ? parseFloat(match[1]) : 0;
  };

  const baseLakhs = parseLakhs(baseSalary);
  const monthlyInr = Math.round((baseLakhs * 100000) / 12);
  const formattedMonthly = `₹${(monthlyInr / 100000).toFixed(2)}L/mo (~₹${monthlyInr.toLocaleString('en-IN')})`;

  const vestingSchedule = [
    { period: 'Yr 1 (12-month cliff)', percent: '—', status: 'Per grant terms', desc: 'Vesting details per the signed grant.' },
  ];

  return (
    <div className="space-y-6">
      {/* 3 Executive Financial Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Base Salary Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm space-y-3 relative overflow-hidden group hover:border-brand-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <Wallet className="h-4 w-4 text-brand-500" /> Guaranteed Cash
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              Fixed Base
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight block">
              {viewMode === 'annual' ? baseSalary : formattedMonthly}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {viewMode === 'annual' ? 'Annual Base Salary (CTC)' : 'Estimated Monthly Pre-Tax'}
            </span>
          </div>
        </div>

        {/* Performance Bonus Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <Award className="h-4 w-4 text-emerald-500" /> Target Incentive
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Variable
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-base font-black text-slate-900 dark:text-white tracking-tight block line-clamp-2">
              {bonus}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Annual Performance & Milestone Bonus
            </span>
          </div>
        </div>

        {/* Equity Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <TrendingUp className="h-4 w-4 text-amber-500" /> Equity Grant
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              4-Year Vest
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-base font-black text-slate-900 dark:text-white tracking-tight block line-clamp-2">
              {equity}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Stock Options with 1-Year Cliff
            </span>
          </div>
        </div>
      </div>

      {/* 4-Year Equity Vesting Schedule Visualizer */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              Stock Options Vesting Schedule (4-Year Plan)
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Vesting details per the signed grant agreement.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${viewMode === 'annual' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >
              Annual
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {vestingSchedule.map((item, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>{item.period}</span>
                <span className="text-amber-600 dark:text-amber-400 font-extrabold">{item.percent}</span>
              </div>
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {item.status}
              </span>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Health & Perks Matrix */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
          Included Health Benefits & Stipends
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {benefit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
