'use client';

import React from 'react';
import { Wallet, ShieldCheck } from '@/lib/lucide-google-icons';
import { OnboardingStepProps } from './useCandidateOnboarding';
import { inputCls, labelCls, selectCls } from './CandidateOnboardingShell';

export function CompensationEligibilityStep({ form, update }: OnboardingStepProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Target Annual Salary (₹ LPA)</label>
          <div className="relative">
            <Wallet className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="number"
              min={0}
              value={form.expectedSalary}
              onChange={(e) => update('expectedSalary', e.target.value)}
              placeholder="e.g. 25"
              className={`${inputCls} pl-10`}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">In lakhs per annum (LPA).</p>
        </div>

        <div>
          <label className={labelCls}>Current CTC (₹ LPA)</label>
          <div className="relative">
            <Wallet className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="number"
              min={0}
              value={form.currentCtc}
              onChange={(e) => update('currentCtc', e.target.value)}
              placeholder="e.g. 18"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Notice Period</label>
          <select value={form.noticePeriod} onChange={(e) => update('noticePeriod', e.target.value)} className={selectCls}>
            <option value="Immediate">Immediate</option>
            <option value="1-2 weeks">1-2 weeks</option>
            <option value="30 days">30 days</option>
            <option value="60+ days">60+ days</option>
            <option value="90 days">90 days</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Work Authorization</label>
          <select
            value={form.workAuthorization}
            onChange={(e) => update('workAuthorization', e.target.value)}
            className={selectCls}
          >
            <option value="Authorized">Authorized — no sponsorship needed</option>
            <option value="Sponsorship Required">Requires visa sponsorship</option>
            <option value="Student / On Work Permit">Student / On work permit</option>
          </select>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-[10px] text-slate-500 rounded-xl border border-white/10 bg-white/5 p-3">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        Salary and authorization are only shared with employers you apply to — never surfaced in public listings.
      </p>
    </div>
  );
}
