'use client';

import React from 'react';
import { Clock, TrendingUp, Award, Scale, ShieldCheck, DollarSign } from '@/lib/lucide-google-icons';

export function AnalyticsKpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Time to Hire */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel flex items-center justify-between hover:scale-[1.01] transition-all">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
            Average Time to Hire
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-display block">42 Hours</span>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <TrendingUp className="h-3 w-3" /> 72% faster than 14-day average
          </span>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900/60 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
          <Clock className="h-5.5 w-5.5" />
        </div>
      </div>

      {/* Card 2: Pass Rate */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel flex items-center justify-between hover:scale-[1.01] transition-all">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
            Candidates Passing AI Test
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-display block">64.2%</span>
          <span className="text-[10px] font-bold text-slate-50 dark:text-slate-400 block">
            48 out of 74 candidates passed
          </span>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
          <Award className="h-5.5 w-5.5" />
        </div>
      </div>

      {/* Card 3: Fairness Check */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel flex items-center justify-between hover:scale-[1.01] transition-all">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
            Fairness &amp; Bias Check
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-display block">99.2%</span>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <ShieldCheck className="h-3 w-3" /> 100% Fair Evaluation
          </span>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
          <Scale className="h-5.5 w-5.5" />
        </div>
      </div>

      {/* Card 4: Cost Savings */}
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-5 shadow-md backdrop-blur-md glass-panel flex items-center justify-between hover:scale-[1.01] transition-all">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
            Cost Saved Per Hire
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-display block">$3,420</span>
          <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 block">
            24 hours saved per candidate
          </span>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
          <DollarSign className="h-5.5 w-5.5" />
        </div>
      </div>
    </div>
  );
}
