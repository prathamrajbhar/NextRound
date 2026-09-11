'use client';

import React from 'react';
import { Users, CheckCircle2 } from '@/lib/lucide-google-icons';
import { CompanyStepProps } from './useCompanyOnboarding';
import { EmailInput } from './CompanyOnboardingShell';

export function TeamInviteStep({ form, addInvite, removeInvite }: CompanyStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <EmailInput
        label="Invite Recruiting Partners"
        placeholder="co-recruiter@company.com"
        emails={form.invites}
        onAdd={addInvite}
        onRemove={removeInvite}
      />
      <p className="text-xs text-slate-400">
        Teammates receive an email invite to join your workspace. You can add more anytime from Settings → Team.
      </p>

      <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3.5">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shrink-0">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Your workspace is ready to launch</p>
          <ul className="text-xs text-slate-400 mt-2 space-y-1.5 leading-relaxed">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Post your first job with a custom AI rubric
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Run automated screening, assessments &amp; voice interviews
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Review candidate scorecards and offer decisions
            </li>
          </ul>
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <Users className="h-4 w-4 text-orange-400 shrink-0" />
        Click &ldquo;Launch HR Portal&rdquo; to create your organization and finish setup.
      </p>
    </div>
  );
}
