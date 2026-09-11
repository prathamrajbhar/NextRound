'use client';

import React from 'react';
import { UserPlus } from 'lucide-react';
import { OnboardingRecord } from '@/types';

export function OnboardingHeaderCard({ onboard }: { onboard: OnboardingRecord }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/45 p-6 sm:p-8 shadow-md backdrop-blur-md glass-panel space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xl font-bold shadow-sm flex-shrink-0">
            <UserPlus className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Onboarding Checklist</h1>
            <p className="text-xs text-slate-550 font-semibold">
              Join date: <span className="font-bold text-indigo-600">{onboard.startDate}</span> • Buddy:{' '}
              {onboard.buddyName}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 block uppercase">Progress</span>
          <span className="text-2xl font-black text-slate-800">{onboard.progressPercent}%</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="w-full bg-slate-200/50 rounded-full h-2 p-0.5 border border-slate-100/40">
          <div
            className="bg-emerald-500 h-1 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-300"
            style={{ width: `${onboard.progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
