'use client';

import React from 'react';
import { Users, CheckCircle2 } from '@/lib/lucide-google-icons';
import { CompanyStepProps } from './useCompanyOnboarding';
import { EmailInput } from './CompanyOnboardingShell';

export function TeamInviteStep({ form, addInvite, removeInvite }: CompanyStepProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <EmailInput
        label="Invite Recruiting Partners"
        placeholder="co-recruiter@company.com"
        emails={form.invites}
        onAdd={addInvite}
        onRemove={removeInvite}
      />
      <p className="text-[10px] text-slate-500">
        Teammates receive an email invite to join your workspace. You can add more anytime from Settings → Team.
      </p>

      <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-300 border border-emerald-500/30 shrink-0">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Your workspace is ready to launch</p>
          <ul className="text-[10px] text-slate-400 mt-1.5 space-y-1 leading-relaxed">
            <li>· Post your first job with a custom AI rubric</li>
            <li>· Run automated screening, assessments &amp; voice interviews</li>
            <li>· Review bias-audited scorecards and offer decisions</li>
          </ul>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
        <Users className="h-3.5 w-3.5" />
        Click &ldquo;Launch HR Portal&rdquo; to create your organization and finish setup.
      </p>
    </div>
  );
}
