'use client';

import React from 'react';
import { Timer, Clock } from '@/lib/lucide-google-icons';
import { CompanyLogo } from '@/components/ui';

interface AptitudeQuestionHeaderProps {
  companyName: string;
  roleTitle: string;
  companyLogoUrl?: string;
  category: string;
  questionTimeLeft: number;
  timeLeft: number;
  currentIndex: number;
  questionCount: number;
}

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};





export function AptitudeQuestionHeader({
  companyName,
  roleTitle,
  companyLogoUrl,
  category,
  questionTimeLeft,
  timeLeft,
  currentIndex,
  questionCount,
}: AptitudeQuestionHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <CompanyLogo name={companyName} logoUrl={companyLogoUrl} size="md" className="shadow-xs flex-shrink-0 border border-slate-200 dark:border-slate-800" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-black font-display text-slate-900 dark:text-slate-100">{companyName}</h2>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-orange-400 border border-brand-200 dark:border-brand-800 uppercase tracking-wider">
              {category}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">{roleTitle} • Category Section</span>
        </div>
      </div>

      {}
      <div className="flex items-center gap-3">
        {}
        <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-500/40 flex items-center gap-2 shadow-xs">
          <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Question Time</span>
            <span className="text-xs font-black font-mono text-amber-800 dark:text-amber-400">{questionTimeLeft}s Remaining</span>
          </div>
        </div>

        {}
        <div className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-xs">
          <Clock className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Time</span>
            <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-200">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 hidden sm:inline-block">
          Question {currentIndex + 1} of {questionCount}
        </span>
      </div>
    </div>
  );
}
