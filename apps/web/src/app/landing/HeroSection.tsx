'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, User } from '@/lib/lucide-google-icons';

interface HeroSectionProps {
  hrHref: string;
  candidateHref: string;
  isLoggedIn: boolean;
}

export function HeroSection({ hrHref, candidateHref, isLoggedIn }: HeroSectionProps) {
  return (
    <section className="relative px-4 sm:px-6 pt-16 pb-20 lg:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_-120px,rgba(99,102,241,0.06),transparent)] dark:bg-[radial-gradient(circle_500px_at_50%_-120px,rgba(99,102,241,0.04),transparent)] pointer-events-none" />

      <div className="lg:col-span-7 space-y-6 text-left relative z-10">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black text-brand-600 dark:text-emerald-400 bg-brand-50/80 dark:bg-emerald-950/30 border border-brand-100 dark:border-emerald-900/40 select-none">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>AI-Powered Voice Screening</span>
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-6xl leading-tight">
          Automate your first-round <br />
          <span className="bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-emerald-400 dark:to-orange-400 bg-clip-text text-transparent">
            candidate calls.
          </span>
        </h1>
        
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed font-medium">
          An AI recruiter that calls and interviews your candidates, asks structured questions, and grades responses. Zero scheduling required.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href={hrHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand-600/10 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <span>{isLoggedIn ? 'Go to HR Dashboard' : 'Hire Talent (Employers)'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={candidateHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 px-6 py-3.5 text-sm font-extrabold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <User className="h-4 w-4" />
            <span>{isLoggedIn ? 'Go to Candidate Dashboard' : 'Practice & Apply (Candidates)'}</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50 flex flex-wrap items-center gap-6 text-slate-400 dark:text-slate-500 select-none">
          <span className="text-xs font-black uppercase tracking-wider">Enterprise Security</span>
          <div className="flex gap-4 text-xs font-bold font-mono">
            <span>🛡️ SOC-2 Type II</span>
            <span>🔒 Encrypted &amp; Secure</span>
            <span>🇪🇺 GDPR Compliant</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 relative z-10 w-full">
        <div className="relative rounded-3xl border border-slate-250 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-xl dark:shadow-2xl p-6 overflow-hidden text-slate-850 dark:text-white max-w-md mx-auto w-full">
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-brand-500/5 dark:bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-900 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center font-black text-indigo-700 dark:text-emerald-400">
                SJ
              </div>
              <div className="text-left">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Sarah Jenkins</h3>
                <span className="text-xs font-bold text-slate-450 dark:text-slate-500">Senior Product Designer</span>
              </div>
            </div>

            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
              92% Fit Score
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-850 flex items-center gap-4 relative z-10 mb-4">
            <button className="h-9 w-9 rounded-full bg-slate-900 dark:bg-orange-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-md transition-all cursor-pointer">
              <span className="text-xs">▶</span>
            </button>

            <div className="flex-grow flex items-center gap-0.5 h-6">
              <div className="h-2 w-1 bg-slate-350 dark:bg-slate-700 rounded-full" />
              <div className="h-4 w-1 bg-slate-350 dark:bg-slate-700 rounded-full" />
              <div className="h-5 w-1 bg-brand-500 dark:bg-orange-500 rounded-full" />
              <div className="h-3 w-1 bg-brand-500 dark:bg-orange-500 rounded-full" />
              <div className="h-6 w-1 bg-brand-500 dark:bg-orange-500 rounded-full" />
              <div className="h-4 w-1 bg-brand-500 dark:bg-orange-500 rounded-full" />
              <div className="h-2 w-1 bg-slate-350 dark:bg-slate-700 rounded-full" />
              <div className="h-5 w-1 bg-slate-350 dark:bg-slate-700 rounded-full" />
              <div className="h-3 w-1 bg-slate-350 dark:bg-slate-700 rounded-full" />
              <div className="h-4 w-1 bg-slate-350 dark:bg-slate-700 rounded-full" />
              <div className="h-2 w-1 bg-slate-350 dark:bg-slate-700 rounded-full" />
            </div>

            <span className="text-xs font-mono font-extrabold text-slate-450 dark:text-slate-500">
              0:45
            </span>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-3.5 text-left text-xs leading-relaxed text-slate-700 dark:text-slate-200 relative z-10 mb-4 font-medium">
            <span className="block text-xs font-black uppercase text-indigo-650 dark:text-indigo-400 mb-1">
              AI Evaluation Summary
            </span>
            <p className="font-sans">
              &quot;Sarah demonstrated strong communication, clear visual design frameworks, and a structured approach to solving team timeline conflicts.&quot;
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2 relative z-10 border-t border-slate-100 dark:border-slate-900">
            <span className="text-xs font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-900 dark:text-slate-400 px-2 py-0.5 rounded-lg border border-slate-150 dark:border-slate-800">
              Product Design
            </span>
            <span className="text-xs font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-900 dark:text-slate-400 px-2 py-0.5 rounded-lg border border-slate-150 dark:border-slate-800">
              Figma
            </span>
            <span className="text-xs font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-900 dark:text-slate-400 px-2 py-0.5 rounded-lg border border-slate-150 dark:border-slate-800">
              User Research
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
