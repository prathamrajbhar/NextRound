'use client';

import React from 'react';
import { OnboardingRecord } from '@/types';

export function OnboardingTeamCard({ onboard }: { onboard: OnboardingRecord }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
        <h4 className="text-xs font-bold text-slate-805 border-b border-slate-100 pb-2">Support Team</h4>

        <div className="space-y-3 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
              {onboard.managerName?.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <span className="block font-bold text-slate-800">{onboard.managerName}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Manager</span>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold border border-emerald-100">
              {onboard.buddyName?.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <span className="block font-bold text-slate-800">{onboard.buddyName}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Onboarding Buddy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel space-y-2">
        <h4 className="text-xs font-bold text-slate-805 border-b border-slate-100 pb-2">Welcome Note</h4>
        <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">
          We are thrilled to welcome you to the {onboard.orgName} family. Follow this list to get set up with laptops,
          corporate emails, and initial training checklists before your first day!
        </p>
      </div>
    </div>
  );
}
