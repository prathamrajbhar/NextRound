'use client';

import React from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import {
  Target,
  Sparkles,
  Zap,
  ShieldCheck,
  Users,
  Briefcase,
} from '@/lib/lucide-google-icons';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <PublicNavbar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex-1 w-full animate-in fade-in duration-300">
        {}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 bg-brand-50 dark:bg-orange-950/80 border border-brand-200/60 dark:border-orange-900/60 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Our Mission &amp; Purpose
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-3 font-display">
            Smarter Interviews. Fairer Hiring.
          </h1>

          <p className="mt-4 text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-medium leading-relaxed">
            NextRound helps engineering teams hire top candidates 70% faster using automated AI voice interviews, coding tests, and objective scorecards.
          </p>

          {}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-8 max-w-xl mx-auto">
            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 shadow-2xs backdrop-blur-md glass-panel">
              <span className="block text-lg sm:text-2xl font-black text-brand-600 dark:text-orange-400 font-display">42 Hours</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Avg Time-to-Hire</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 shadow-2xs backdrop-blur-md glass-panel">
              <span className="block text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">99.2%</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Rubric Accuracy</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 shadow-2xs backdrop-blur-md glass-panel">
              <span className="block text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-display">100k+</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Applicants Screened</span>
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-16">
          {}
          <div className="rounded-3xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 p-6 md:p-8 shadow-sm backdrop-blur-md glass-panel space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 font-display">The Hiring Problem</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Traditional recruiting takes 3+ weeks per candidate. HR teams spend endless hours manually reading resumes, scheduling interview slots, and dealing with inconsistent interviewer grading feedback.
              </p>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-rose-800 dark:text-rose-300 pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
              <li className="flex items-center gap-2">❌ Slow 14-day screening cycles</li>
              <li className="flex items-center gap-2">❌ Inconsistent human scoring</li>
              <li className="flex items-center gap-2">❌ Schedule coordination delays</li>
            </ul>
          </div>

          {}
          <div className="rounded-3xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 p-6 md:p-8 shadow-sm backdrop-blur-md glass-panel space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 font-display">How NextRound Fixes It</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                NextRound automates early candidate vetting with 15-minute AI voice interviews, LeetCode-style coding tests, and objective rubrics. Candidates get fast feedback, and HR gets clean candidate scorecards.
              </p>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40">
              <li className="flex items-center gap-2">✓ 42-hour time-to-hire turnaround</li>
              <li className="flex items-center gap-2">✓ Objective rubric-based scoring</li>
              <li className="flex items-center gap-2">✓ Automated voice &amp; coding grading</li>
            </ul>
          </div>
        </div>

        {}
        <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-8 shadow-md backdrop-blur-md glass-panel mb-16 space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-200/60 dark:border-slate-800 pb-4">
            <ShieldCheck className="h-6 w-6 text-brand-600 dark:text-orange-400" />
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 font-display">
                How NextRound Guarantees Fair &amp; Fast Evaluation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Built on objective AI evaluation rubrics and transparent candidate feedback.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-brand-100 dark:bg-orange-950/80 text-brand-600 dark:text-orange-400 text-xs font-extrabold flex items-center justify-center border border-brand-200 dark:border-orange-800">
                  1
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Anonymized Resume Parsing</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Demographic markers like profile photos, name, and age are masked to evaluate candidates purely on technical skills and work history.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  2
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Interactive AI Voice Interviews</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Candidates complete a 15-minute voice session at their convenience. An AI interviewer presents role-specific questions and transcribes answers live.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                  3
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Online MCQ &amp; Coding Assessments</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Candidates solve technical multiple-choice questions and live coding problems with real-time test suite execution.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 text-xs font-extrabold flex items-center justify-center border border-purple-200 dark:border-purple-800">
                  4
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Structured Decision Rubrics</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Every candidate scorecard is evaluated against configurable dimension weights for consistent, objective shortlist recommendations.
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 dark:from-slate-900 dark:via-orange-950 dark:to-slate-900 p-8 md:p-10 text-white text-center shadow-xl space-y-6">
          <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight">
            Ready to Experience Modern AI Hiring?
          </h2>
          <p className="text-xs md:text-sm text-slate-300 font-medium max-w-xl mx-auto">
            Whether you are an engineering team looking to hire or a candidate preparing for interviews, NextRound makes the process fast, fair, and seamless.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/candidate/jobs"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Briefcase className="h-4 w-4" />
              <span>Browse Open Jobs</span>
            </Link>

            <Link
              href="/hr/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="h-4 w-4" />
              <span>Open HR Console</span>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
