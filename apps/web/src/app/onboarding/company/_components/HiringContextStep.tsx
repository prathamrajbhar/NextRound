'use client';

import React from 'react';
import { Zap, Briefcase, Plus, X } from '@/lib/lucide-google-icons';
import { CompanyStepProps } from './useCompanyOnboarding';
import { inputCls, labelCls, selectCls } from './CompanyOnboardingShell';

const VELOCITIES = [
  { value: '0-2', label: '0-2 hires / quarter' },
  { value: '3-10', label: '3-10 hires / quarter' },
  { value: '11-30', label: '11-30 hires / quarter' },
  { value: '30+', label: '30+ hires / quarter (high volume)' },
];

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
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <label className={labelCls}>Hiring Velocity</label>
        <div className="relative">
          <Zap className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
          <select
            value={form.hiringVelocity}
            onChange={(e) => update('hiringVelocity', e.target.value)}
            className={`${selectCls} pl-10`}
          >
            {VELOCITIES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5">Helps us scale the pipeline stages and automation for your volume.</p>
      </div>

      <div>
        <label className={labelCls}>Roles You Typically Hire For</label>
        {form.primaryRoles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.primaryRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-200"
              >
                {role}
                <button type="button" onClick={() => removeRole(role)} className="hover:text-white cursor-pointer" aria-label={`Remove ${role}`}>
                  <X className="h-3 w-3" />
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
            placeholder="Add a role..."
            className={inputCls}
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 cursor-pointer flex items-center justify-center border border-white/15 transition-all"
            aria-label="Add role"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {ROLE_SUGGESTIONS.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleSuggestion(role)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                form.primaryRoles.includes(role)
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-300 border border-orange-500/30">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Auto-Offer for high scores</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Let the Decision Agent send offers automatically for candidates above your threshold.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => update('autoOffer', !form.autoOffer)}
          aria-label="Toggle auto-offer"
          className={`shrink-0 w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
            form.autoOffer ? 'bg-orange-600' : 'bg-slate-700'
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
