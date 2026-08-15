'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ArrowLeft, ArrowRight, Loader2, Plus, X, Sparkles, ShieldCheck } from '@/lib/lucide-google-icons';

export const inputCls =
  'w-full px-4 py-3.5 text-sm rounded-xl border border-slate-800 bg-slate-900/90 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 font-medium transition-all shadow-sm';
export const labelCls = 'block text-xs font-black uppercase tracking-wider text-slate-200 mb-2';
export const selectCls = `${inputCls} appearance-none [&>option]:bg-slate-900 [&>option]:text-white cursor-pointer`;

export interface OnboardingStep {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

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
  const progressPercent = Math.round(((current + 1) / steps.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-orange-500 selection:text-white">
      <aside className="w-full lg:w-[38%] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-r border-slate-800/80 p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-20 -left-20 h-72 w-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-8 relative z-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 rounded-xl overflow-hidden group-hover:scale-105 transition-transform border border-orange-500/40 shadow-md shrink-0">
                <Image src="/logo.png" alt="NextRound Logo" fill sizes="40px" className="object-cover scale-[1.2]" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Next<span className="text-orange-500">Round</span>
              </span>
            </Link>

            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Sparkles className="h-3.5 w-3.5" />
              AI Recruiter Engine
            </span>
          </div>

          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-black uppercase tracking-widest text-orange-400">
              Phase 0{current + 1} of 0{steps.length}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight font-display">
              {steps[current].label}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              {steps[current].description}
            </p>
          </div>

          <ol className="space-y-4 pt-4">
            {steps.map((step, idx) => {
              const active = idx === current;
              const done = idx < current;
              const Icon = step.icon;

              return (
                <li key={step.label} className="flex items-center gap-4 group">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-extrabold transition-all duration-200 shrink-0 border ${
                      active
                        ? 'bg-orange-500 text-white border-orange-400 ring-4 ring-orange-500/20 shadow-lg shadow-orange-500/30'
                        : done
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {done ? <Check className="h-4.5 w-4.5" /> : <Icon className="h-4.5 w-4.5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-bold truncate transition-colors ${
                        active ? 'text-white font-black' : done ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="pt-8 relative z-10">
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-orange-400" />
                Profile AI Readiness
              </span>
              <span className="text-sm font-black text-orange-400 font-mono">{progressPercent}%</span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden relative border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 leading-normal">Your profile powers the AI screening, matching and mock-interview agents.</p>
          </div>
        </div>
      </aside>

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

interface TagInputProps {
  label: string;
  placeholder: string;
  hint?: string;
  tags: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}

export function TagInput({ label, placeholder, hint, tags, onAdd, onRemove }: TagInputProps) {
  const [draft, setDraft] = React.useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(draft);
    setDraft('');
  };

  return (
    <div>
      <label className={labelCls}>{label}</label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 shadow-sm"
            >
              {tag}
              <button type="button" onClick={() => onRemove(tag)} className="hover:text-white cursor-pointer" aria-label={`Remove ${tag}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex gap-2.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm px-5 cursor-pointer flex items-center justify-center border border-slate-700 transition-all shadow-sm"
          aria-label={`Add ${label}`}
        >
          <Plus className="h-4.5 w-4.5" />
        </button>
      </form>
      {hint && <p className="text-xs text-slate-400 mt-1.5 leading-normal">{hint}</p>}
    </div>
  );
}
