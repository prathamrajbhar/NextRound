'use client';

import React, { useState } from 'react';
import { Wallet, Award, TrendingUp, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

interface RewardsGridProps {
  baseSalary: string;
  bonus: string;
  equity: string;
  benefits: string[];
}

export function ExecutiveRewardsGrid({
  baseSalary,
  bonus,
  equity,
  benefits,
}: RewardsGridProps) {
  const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');

  const parseLakhs = (valStr: string) => {
    const match = valStr.match(/₹?(\d+(\.\d+)?)L/i);
    return match ? parseFloat(match[1]) : 0;
  };

  const baseLakhs = parseLakhs(baseSalary);
  const monthlyInr = Math.round((baseLakhs * 100000) / 12);
  const formattedMonthly = `₹${(monthlyInr / 100000).toFixed(2)}L/mo (~₹${monthlyInr.toLocaleString('en-IN')})`;

  const vestingTimeline = [
    { label: 'Vesting', pct: '—', detail: 'Schedule per the signed grant agreement.' },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Total Rewards & Compensation Breakdown
        </h2>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('annual')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${viewMode === 'annual' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Annual
          </button>
          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* 3 Primary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Base Cash */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Wallet className="h-4 w-4 text-brand-500" /> Guaranteed Base
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              Fixed
            </span>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight block">
            {viewMode === 'annual' ? baseSalary : formattedMonthly}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            {viewMode === 'annual' ? 'Guaranteed Annual Base Compensation' : 'Estimated Monthly Pre-tax Payout'}
          </span>
        </div>

        {/* Bonus */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Award className="h-4 w-4 text-emerald-500" /> Performance Bonus
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Variable
            </span>
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight block line-clamp-2">
            {bonus}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Annual target based on team & individual KPIs
          </span>
        </div>

        {/* Equity */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <TrendingUp className="h-4 w-4 text-amber-500" /> Stock Options
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              4-Yr Vest
            </span>
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight block line-clamp-2">
            {equity}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Subject to standard 1-year cliff
          </span>
        </div>
      </div>

      {/* 4-Year ESOP Vesting Schedule Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" /> Equity Vesting Schedule
          </span>
          <span className="text-slate-400 font-medium text-[11px]">Per grant terms</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {vestingTimeline.map((item, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>{item.label}</span>
                <span className="text-amber-600 dark:text-amber-400">{item.pct}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Health & Benefits List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3 shadow-sm">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Included Health Benefits & Perks
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold text-slate-800 dark:text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
