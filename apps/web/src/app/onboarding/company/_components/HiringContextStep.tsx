'use client';

import React from 'react';
import { Briefcase, Plus, X } from '@/lib/lucide-google-icons';
import { CompanyStepProps } from './useCompanyOnboarding';
import { inputCls, labelCls } from './CompanyOnboardingShell';

const ROLE_SUGGESTIONS = [
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full-Stack Engineer',
  'Data Engineer',
  'DevOps / SRE',
  'Product Designer',
  'Technical PM',
  'QA / SDET',
  'Sales / Account Executive',
];

export function HiringContextStep({ form, update, addRole, removeRole }: CompanyStepProps) {
  const [draft, setDraft] = React.useState('');

  const submitRole = (e: React.FormEvent) => {
    e.preventDefault();
    addRole(draft);
    setDraft('');
  };

  const toggleSuggestion = (role: string) => {
    if (form.primaryRoles.includes(role)) {
      removeRole(role);
    } else {
      addRole(role);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <label className={labelCls}>Roles You Typically Hire For</label>
        <p className="text-xs text-slate-400 mb-3">
          Select or add the typical roles for your company to configure AI screening &amp; matching agents.
        </p>
        {form.primaryRoles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {form.primaryRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-200"
              >
                {role}
                <button type="button" onClick={() => removeRole(role)} className="hover:text-white cursor-pointer" aria-label={`Remove ${role}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <form onSubmit={submitRole} className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Senior Backend Engineer"
            className={inputCls}
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 cursor-pointer flex items-center justify-center border border-slate-800 transition-all shadow-sm"
            aria-label="Add role"
          >
            <Plus className="h-4 w-4 mr-1 text-orange-400" />
            Add
          </button>
        </form>
        <div className="flex flex-wrap gap-2 mt-3">
          {ROLE_SUGGESTIONS.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleSuggestion(role)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                form.primaryRoles.includes(role)
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 border border-orange-500/30 shrink-0">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Auto-Offer for top candidates</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Let the Decision Agent trigger offer rollouts automatically for candidates exceeding the benchmark.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => update('autoOffer', !form.autoOffer)}
          aria-label="Toggle auto-offer"
          className={`shrink-0 w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
            form.autoOffer ? 'bg-orange-500' : 'bg-slate-800'
          }`}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white transition-transform ${
              form.autoOffer ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
