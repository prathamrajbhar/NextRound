'use client';

import React from 'react';
import Link from 'next/link';
import { Mic, FileText, Search, Sparkles, ArrowUpRight } from '@/lib/lucide-google-icons';

interface CandidateDashboardHeroProps {
  candidateName: string;
  totalAppsCount: number;
}

export function CandidateDashboardHero({ candidateName, totalAppsCount }: CandidateDashboardHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-slate-50 via-slate-50/95 to-slate-100/90 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/90 p-6 md:p-8 shadow-md dark:shadow-2xl">
      {}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>AI Candidate Workspace</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight flex flex-wrap items-center gap-x-2">
            <span>Welcome back,</span>
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent font-bold">
              {candidateName}
            </span>
          </h1>

          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
            Track your application pipeline, hone your responses with realistic AI mock interviews, and optimize your resume for top engineering roles.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
              <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
              <span>Status: Active Job Seeker</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
              {totalAppsCount} Active {totalAppsCount === 1 ? 'Application' : 'Applications'}
            </span>
          </div>
        </div>

        {}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <Link
            href="/candidate/mock/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/10 dark:shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-emerald-400/30"
          >
            <Mic className="h-4 w-4" />
            <span>Start AI Practice Mock</span>
          </Link>

          <Link
            href="/candidate/resume-builder"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
          >
            <FileText className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            <span>AI Resume</span>
          </Link>

          <Link
            href="/candidate/jobs"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/40 shadow-sm transition-all cursor-pointer"
          >
            <Search className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span>Browse Jobs</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
          </Link>
        </div>
      </div>
    </div>
  );
}
