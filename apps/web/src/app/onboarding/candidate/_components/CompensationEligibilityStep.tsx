'use client';

import React from 'react';
import { Wallet, ShieldCheck, TrendingUp, IndianRupee } from '@/lib/lucide-google-icons';
import { OnboardingStepProps } from './useCandidateOnboarding';
import { inputCls, labelCls } from './CandidateOnboardingShell';

const SALARY_PRESETS = [
  { label: '15 – 25 LPA', min: '15', max: '25' },
  { label: '25 – 40 LPA', min: '25', max: '40' },
  { label: '40 – 60 LPA', min: '40', max: '60' },
  { label: '60+ LPA', min: '60', max: '90' },
];

const NOTICE_PERIODS = [
  { value: 'Immediate', label: 'Immediate ⚡' },
  { value: '15 days', label: '15 Days' },
  { value: '30 days', label: '30 Days' },
  { value: '60 days', label: '60 Days' },
  { value: '90 days', label: '90 Days' },
];

const numberInputCls = `${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

export function CompensationEligibilityStep({ form, update }: OnboardingStepProps) {
  const currentCtcNum = Number(form.currentCtc) || 0;
  const minSalNum = Number(form.expectedSalaryMin) || Number(form.expectedSalary) || 0;
  const maxSalNum = Number(form.expectedSalaryMax) || minSalNum || 0;

  
  const minHikePercent =
    currentCtcNum > 0 && minSalNum > currentCtcNum
      ? Math.round(((minSalNum - currentCtcNum) / currentCtcNum) * 100)
      : 0;

  const maxHikePercent =
    currentCtcNum > 0 && maxSalNum > currentCtcNum
      ? Math.round(((maxSalNum - currentCtcNum) / currentCtcNum) * 100)
      : 0;

  const applyPreset = (min: string, max: string) => {
    update('expectedSalaryMin', min);
    update('expectedSalaryMax', max);
    update('expectedSalary', max);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
        <label className={labelCls}>Current CTC (₹ LPA)</label>
        <div className="relative">
          <IndianRupee className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="number"
            min={0}
            value={form.currentCtc ?? ''}
            onChange={(e) => update('currentCtc', e.target.value)}
            placeholder="e.g. 15"
            className={`${numberInputCls} pl-10`}
          />
        </div>
        <p className="text-xs text-slate-400 font-medium">Your current annual compensation in Lakhs Per Annum (LPA)</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <label className={labelCls}>Target Salary Range (₹ LPA)</label>
            <p className="text-xs text-slate-400 font-medium">Expected annual salary range for your next role</p>
          </div>

          {minSalNum > 0 && maxSalNum > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-black text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/30">
                Target: ₹{minSalNum}L – ₹{maxSalNum}L LPA
              </span>
              {maxHikePercent > 0 && (
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {minHikePercent > 0 && minHikePercent !== maxHikePercent
                    ? `+${minHikePercent}% to +${maxHikePercent}% Hike`
                    : `+${maxHikePercent}% Hike`}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-center">
          <div>
            <label className="block text-xs font-black text-slate-300 mb-1.5">Min Target (₹ LPA)</label>
            <div className="relative">
              <Wallet className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="number"
                min={0}
                value={form.expectedSalaryMin ?? ''}
                onChange={(e) => {
                  update('expectedSalaryMin', e.target.value);
                  if (!form.expectedSalaryMax) update('expectedSalaryMax', e.target.value);
                }}
                placeholder="e.g. 18"
                className={`${numberInputCls} pl-10`}
              />
            </div>
          </div>

          <div className="hidden sm:flex items-center justify-center pt-5 text-slate-600 font-black text-xs">
            <span>TO</span>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-300 mb-1.5">Max Target (₹ LPA)</label>
            <div className="relative">
              <Wallet className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="number"
                min={0}
                value={form.expectedSalaryMax ?? ''}
                onChange={(e) => {
                  update('expectedSalaryMax', e.target.value);
                  update('expectedSalary', e.target.value);
                }}
                placeholder="e.g. 30"
                className={`${numberInputCls} pl-10`}
              />
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-2">Quick Presets</span>
          <div className="flex flex-wrap gap-2">
            {SALARY_PRESETS.map((preset) => {
              const isSelected = form.expectedSalaryMin === preset.min && form.expectedSalaryMax === preset.max;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.min, preset.max)}
                  className={`text-xs font-black px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Notice Period</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {NOTICE_PERIODS.map((item) => {
            const isSelected = (form.noticePeriod || '').toLowerCase() === item.value.toLowerCase();
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => update('noticePeriod', item.value)}
                className={`py-3 px-3 rounded-xl border text-xs font-black text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="flex items-center gap-2.5 text-xs text-slate-300 font-medium rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
        <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
        <span>Salary targets &amp; notice period are strictly private — only shared with employers you apply to.</span>
      </p>
    </div>
  );
}
