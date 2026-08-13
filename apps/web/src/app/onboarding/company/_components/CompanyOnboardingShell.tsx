'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ArrowLeft, ArrowRight, Loader2, Plus, X } from '@/lib/lucide-google-icons';

export const inputCls =
  'w-full px-3.5 py-2.5 text-xs rounded-xl border border-white/15 bg-slate-900/40 text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:bg-slate-900/70 font-semibold transition-all';
export const labelCls = 'block text-[11px] font-bold text-slate-300 mb-1.5';
export const selectCls = `${inputCls} appearance-none [&>option]:bg-slate-900 [&>option]:text-white`;

export interface CompanyStep {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CompanyOnboardingShellProps {
  steps: CompanyStep[];
  current: number;
  stepTitle: string;
  stepDescription: string;
  children: ReactNode;
  error?: string;
  onBack?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  submitting?: boolean;
}

export function CompanyOnboardingShell({
  steps,
  current,
  stepTitle,
  stepDescription,
  children,
  error,
  onBack,
  onNext,
  onFinish,
  submitting,
}: CompanyOnboardingShellProps) {
  const isLast = current === steps.length - 1;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        {}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <Link href="/" className="inline-flex items-center gap-2.5 group w-fit">
            <div className="relative h-9 w-9 rounded-full overflow-hidden group-hover:scale-105 transition-transform flex-shrink-0 border border-white/40 shadow-md">
              <Image src="/logo.png" alt="NextRound Logo" fill sizes="36px" className="object-cover scale-[1.3]" />
            </div>
            <span className="text-xl font-black tracking-tight text-white font-display">
              Next<span className="text-orange-400">Round</span>
            </span>
          </Link>

          <ol className="space-y-0">
            {steps.map((step, idx) => {
              const done = idx < current;
              const active = idx === current;
              const Icon = step.icon;
              return (
                <li key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center border transition-all ${
                        active
                          ? 'bg-orange-600 border-orange-400 text-white shadow-lg shadow-orange-600/30'
                          : done
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-900/60 border-white/10 text-slate-500'
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    {idx < steps.length - 1 && <div className="w-px flex-1 bg-white/10 min-h-5" />}
                  </div>
                  <div className={`pb-5 pt-1.5 ${active ? 'text-white' : 'text-slate-500'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest">{step.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-auto hidden lg:block">
            NextRound&apos;s AI pipeline handles sourcing, screening, voice interviews, evaluation and offer — this setup powers the Scheduler and Decision agents.
          </p>
        </aside>

        {}
        <section className="lg:col-span-8 rounded-3xl border border-white/15 bg-slate-950/40 p-6 sm:p-8 shadow-2xl shadow-slate-950/80 backdrop-blur-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-200">
          <div className="mb-6 pb-4 border-b border-white/10">
            <span className="text-[10px] uppercase tracking-widest text-orange-400 font-black">
              Step {current + 1} of {steps.length}
            </span>
            <h1 className="text-xl font-black text-white font-display mt-1">{stepTitle}</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{stepDescription}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl border border-rose-500/40 bg-rose-950/60 text-xs font-bold text-rose-300">
              {error}
            </div>
          )}

          {children}

          <div className="flex justify-between items-center pt-6 border-t border-white/10 mt-6">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            ) : (
              <span />
            )}

            {isLast && onFinish ? (
              <button
                type="button"
                onClick={onFinish}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-orange-600/30 transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Launching HR Portal...
                  </>
                ) : (
                  <>
                    Launch HR Portal
                    <Check className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : onNext ? (
              <button
                type="button"
                onClick={onNext}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-orange-600/30 transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

interface EmailInputProps {
  label: string;
  placeholder: string;
  emails: string[];
  onAdd: (email: string) => void;
  onRemove: (email: string) => void;
}

export function EmailInput({ label, placeholder, emails, onAdd, onRemove }: EmailInputProps) {
  const [draft, setDraft] = React.useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = draft.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      onAdd(email);
      setDraft('');
    }
  };

  return (
    <div>
      <label className={labelCls}>{label}</label>
      {emails.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {emails.map((email) => (
            <div
              key={email}
              className="flex items-center justify-between p-2 rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-slate-200"
            >
              <span>{email}</span>
              <button
                type="button"
                onClick={() => onRemove(email)}
                className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                aria-label={`Remove ${email}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 cursor-pointer flex items-center justify-center gap-1 border border-white/15 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </form>
    </div>
  );
}
