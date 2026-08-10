'use client';

import React from 'react';
import { Check, XCircle, Zap, Cpu, ShieldCheck, RotateCcw, ArrowRight } from '@/lib/lucide-google-icons';
import { CodingProblem, SupportedLanguage } from './useCodingProblem';
import { TestResult } from './types';

interface CodingSubmissionSummaryProps {
  problem: CodingProblem;
  language: SupportedLanguage;
  finalPassRate: number;
  testResults: TestResult[];
  complexityFeedback: string | null;
  onReview: () => void;
  onComplete: (score: number) => void;
}

/**
 * Completion card shown after a successful submit: pass rate, sandbox
 * complexity analysis, difficulty, and the final "view feedback" action.
 */
export function CodingSubmissionSummary({
  problem,
  language,
  finalPassRate,
  testResults,
  complexityFeedback,
  onReview,
  onComplete,
}: CodingSubmissionSummaryProps) {
  const passedCount = testResults.filter((r) => r.status === 'passed').length;

  return (
    <div className="w-full max-w-xl mx-auto my-auto p-8 rounded-3xl border border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl text-left space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="flex items-center gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="relative">
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-md border ${
            finalPassRate > 0
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}>
            {finalPassRate > 0 ? <Check className="h-7 w-7 stroke-[3]" /> : <XCircle className="h-7 w-7" />}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              finalPassRate > 0
                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
            }`}>
              {finalPassRate > 0 ? 'Submission Evaluated' : 'Execution Failed'}
            </span>
            <span className="text-xs text-slate-500 font-mono">• {language}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1 font-display">
            {problem.title} Evaluation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Evaluation processed with {finalPassRate}% pass rate.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold">Pass Rate</span>
            <Zap className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
            {finalPassRate}%
          </div>
          <span className={`inline-block mt-1 text-[10px] font-bold ${finalPassRate > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {passedCount} of {testResults.length} passed
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold">Complexity</span>
            <Cpu className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
            {complexityFeedback || problem.expectedComplexity.time}
          </div>
          <span className="inline-block mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Sandbox analysis
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold">Difficulty</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
            {problem.difficulty}
          </div>
          <span className="inline-block mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {problem.category}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onReview}
          className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Review Code</span>
        </button>

        <button
          type="button"
          onClick={() => onComplete(finalPassRate)}
          className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
        >
          <span>View Evaluation Feedback</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
