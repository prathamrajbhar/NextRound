'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles, Clock } from '@/lib/lucide-google-icons';
import { CompanyLogo } from '@/components/ui';

interface FeedbackHeaderCardProps {
  targetCompany: string;
  targetRole: string;
  score: number;
}

export function FeedbackHeaderCard({
  targetCompany,
  targetRole,
  score,
}: FeedbackHeaderCardProps) {
  const performance =
    score >= 85
      ? {
          text: 'Excellent Match',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60',
        }
      : score >= 75
      ? {
          text: 'Strong Match',
          bg: 'bg-brand-50 dark:bg-orange-950/60 text-brand-700 dark:text-orange-300 border-brand-200 dark:border-orange-900/60',
        }
      : {
          text: 'Needs Calibration',
          bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60',
        };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-400">
        <Link
          href="/candidate/dashboard"
          className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        <Link
          href="/candidate/mock/new"
          className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          Mock Practice
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        <span className="text-slate-700 dark:text-slate-200 font-bold">Report</span>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/80 via-white/50 to-slate-50/50 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-950/90 p-6 md:p-8 shadow-md backdrop-blur-md glass-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex gap-4 items-center">
          <CompanyLogo name={targetCompany} size="lg" className="shadow-md flex-shrink-0" />
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-orange-300 bg-brand-50 dark:bg-orange-950/60 border border-brand-200/60 dark:border-orange-900/60 mb-1">
              <Sparkles className="h-3 w-3 text-brand-600 dark:text-orange-400" /> AI Evaluator Scorecard
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
              {targetRole} Evaluation
            </h1>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              <span>
                Target Blueprint: <strong className="text-emerald-600 dark:text-emerald-400">{targetCompany}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" /> Session Completed
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 p-4 rounded-2xl shadow-2xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Overall Readiness Score
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl md:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display">
                {score}%
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">/ 100</span>
            </div>
          </div>
          <span
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-extrabold tracking-wider uppercase ${performance.bg}`}
          >
            {performance.text}
          </span>
        </div>
      </div>
    </div>
  );
}
