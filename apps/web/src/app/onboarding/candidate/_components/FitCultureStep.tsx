'use client';

import React from 'react';
import { Trophy, ScrollText, ChevronUp, ChevronDown } from '@/lib/lucide-google-icons';
import { OnboardingStepProps } from './useCandidateOnboarding';
import { inputCls, labelCls } from './CandidateOnboardingShell';

export function FitCultureStep({ form, update }: OnboardingStepProps) {
  const moveValue = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= form.workValues.length) return;
    const copy = [...form.workValues];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    update('workValues', copy);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <label className={labelCls}>Describe a Project You&apos;re Proud Of</label>
        <div className="relative">
          <Trophy className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <textarea
            rows={3}
            value={form.proudProject}
            onChange={(e) => update('proudProject', e.target.value)}
            placeholder="Explain the technical details of something you shipped — stack, your role, and the impact..."
            className={`${inputCls} pl-10 resize-none leading-relaxed`}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5">Gives the evaluator agent concrete signal beyond the resume.</p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className={labelCls}>About Me / Summary</label>
          <span className="text-[10px] font-semibold text-slate-500">{form.bio.length} / 1000</span>
        </div>
        <div className="relative">
          <ScrollText className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <textarea
            rows={3}
            maxLength={1000}
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            placeholder="Brief description of your background and what you're looking for..."
            className={`${inputCls} pl-10 resize-none leading-relaxed`}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Work Values — Priority Ranking</label>
        <p className="text-[10px] text-slate-500 mb-2">Reorder to reflect what matters most to you.</p>
        <div className="space-y-1.5">
          {form.workValues.map((val, idx) => (
            <div
              key={val}
              className="flex justify-between items-center p-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-200"
            >
              <span>
                <span className="text-orange-400 font-black mr-2">{idx + 1}.</span>
                {val}
              </span>
              <div className="flex gap-1 text-slate-400 select-none">
                <button
                  type="button"
                  onClick={() => moveValue(idx, -1)}
                  disabled={idx === 0}
                  className="p-1 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-30 cursor-pointer"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveValue(idx, 1)}
                  disabled={idx === form.workValues.length - 1}
                  className="p-1 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-30 cursor-pointer"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
