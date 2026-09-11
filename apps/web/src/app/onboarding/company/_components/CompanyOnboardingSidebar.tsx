'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Sparkles, Building2 } from '@/lib/lucide-google-icons';

export interface CompanyStep {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CompanyOnboardingSidebarProps {
  steps: CompanyStep[];
  current: number;
}

export function CompanyOnboardingSidebar({ steps, current }: CompanyOnboardingSidebarProps) {
  const progressPercent = Math.round(((current + 1) / steps.length) * 100);

  return (
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
            Recruiter Portal
          </span>
        </div>

        <div className="space-y-2.5 pt-2">
          <span className="text-xs font-black uppercase tracking-widest text-orange-400">
            Step 0{current + 1} of 0{steps.length}
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
              <Building2 className="h-4 w-4 text-orange-400" />
              Workspace Setup
            </span>
            <span className="text-sm font-black text-orange-400 font-mono">{progressPercent}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden relative border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 leading-normal">
            NextRound AI pipeline powers automated sourcing, screening, voice interviews and offer decisions.
          </p>
        </div>
      </div>
    </aside>
  );
}
