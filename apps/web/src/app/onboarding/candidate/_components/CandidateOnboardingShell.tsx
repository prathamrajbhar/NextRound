'use client';

import React, { ReactNode } from 'react';
import { Check, ArrowLeft, ArrowRight, Loader2, X } from '@/lib/lucide-google-icons';
import { CandidateOnboardingSidebar, OnboardingStep } from './CandidateOnboardingSidebar';
import { TagInput } from './TagInput';

export const inputCls =
  'w-full px-4 py-3.5 text-sm rounded-xl border border-slate-800 bg-slate-900/90 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 font-medium transition-all shadow-sm';
export const labelCls = 'block text-xs font-black uppercase tracking-wider text-slate-200 mb-2';
export const selectCls = `${inputCls} appearance-none [&>option]:bg-slate-900 [&>option]:text-white cursor-pointer`;

export type { OnboardingStep };
export { TagInput };

interface CandidateOnboardingShellProps {
  steps: OnboardingStep[];
  current: number;
  stepTitle: string;
  stepDescription: string;
  children: ReactNode;
  error?: string;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  onFinish?: () => void;
  submitting?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}

export function CandidateOnboardingShell({
  steps,
  current,
  stepTitle,
  stepDescription,
  children,
  error,
  onBack,
  onNext,
  nextLabel,
  onFinish,
  submitting,
  showSkip,
  onSkip,
}: CandidateOnboardingShellProps) {
  const isLast = current === steps.length - 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-orange-500 selection:text-white">
      <CandidateOnboardingSidebar steps={steps} current={current} />

      <main className="w-full lg:w-[62%] bg-slate-950 p-6 sm:p-12 lg:p-14 flex flex-col justify-between min-h-screen">
        <div className="w-full max-w-2xl mx-auto space-y-8 my-auto">
          <div className="pb-6 border-b border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-orange-400">
                Step 0{current + 1}
              </span>
              <span className="text-xs font-mono font-black text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                {current + 1} / {steps.length}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">{stepTitle}</h1>
            <p className="text-sm sm:text-base text-slate-400 font-medium mt-1.5 leading-relaxed">{stepDescription}</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-sm font-bold text-rose-300 flex items-center gap-2.5 shadow-md">
              <X className="h-4.5 w-4.5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div key={current} className="animate-in fade-in slide-in-from-right-3 duration-200">
            {children}
          </div>
        </div>

        <footer className="w-full max-w-2xl mx-auto pt-8 border-t border-slate-800/80 mt-10 flex items-center justify-between">
          <div>
            {showSkip && onSkip ? (
              <button
                type="button"
                onClick={onSkip}
                disabled={submitting}
                className="text-xs sm:text-sm font-bold text-slate-400 hover:text-white cursor-pointer disabled:opacity-50 transition-colors"
              >
                Skip for now
              </button>
            ) : onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 cursor-pointer transition-all shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}
          </div>

          <div>
            {isLast && onFinish ? (
              <button
                type="button"
                onClick={onFinish}
                disabled={submitting}
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-orange-500/25 transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50 border border-orange-400/40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>{nextLabel || 'Complete Profile'}</span>
                    <Check className="h-4.5 w-4.5" />
                  </>
                )}
              </button>
            ) : onNext ? (
              <button
                type="button"
                onClick={onNext}
                disabled={submitting}
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-orange-500/25 transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50 border border-orange-400/40"
              >
                <span>{nextLabel || 'Continue'}</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            ) : null}
          </div>
        </footer>
      </main>
    </div>
  );
}
