'use client';

import React from 'react';
import { Building2, Bot, Save } from '@/lib/lucide-google-icons';

interface GeneralSettingsTabProps {
  orgName: string;
  setOrgName: (val: string) => void;
  orgDomain: string;
  setOrgDomain: (val: string) => void;
  supportEmail: string;
  setSupportEmail: (val: string) => void;
  timezone: string;
  setTimezone: (val: string) => void;
  defaultThreshold: number;
  setDefaultThreshold: (val: number) => void;
  defaultVoice: string;
  setDefaultVoice: (val: string) => void;
  autoInvite: boolean;
  setAutoInvite: (val: boolean) => void;
  anonymizeResumes: boolean;
  setAnonymizeResumes: (val: boolean) => void;
  onSave: () => void;
}

export function GeneralSettingsTab({
  orgName,
  setOrgName,
  orgDomain,
  setOrgDomain,
  supportEmail,
  setSupportEmail,
  timezone,
  setTimezone,
  defaultThreshold,
  setDefaultThreshold,
  defaultVoice,
  setDefaultVoice,
  autoInvite,
  setAutoInvite,
  anonymizeResumes,
  setAnonymizeResumes,
  onSave,
}: GeneralSettingsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <Building2 className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
            Organization &amp; Workspace Profile
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Company Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Website URL
            </label>
            <input
              type="url"
              value={orgDomain}
              onChange={(e) => setOrgDomain(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Support Contact Email
            </label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Primary Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Asia/Kolkata (GMT+5:30)">Asia/Kolkata (GMT+5:30)</option>
              <option value="America/New_York (EST)">America/New_York (EST)</option>
              <option value="Europe/London (GMT)">Europe/London (GMT)</option>
              <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <Bot className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
            Global AI Screening &amp; Cutoff Rules
          </h3>
        </div>

        <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <div>
            <div className="flex justify-between mb-1 text-[11px] font-bold">
              <span>Default Candidate Passing Score Cutoff</span>
              <span className="text-brand-600 dark:text-orange-400 font-extrabold">{defaultThreshold}% Score</span>
            </div>
            <input
              type="range"
              min="60"
              max="95"
              value={defaultThreshold}
              onChange={(e) => setDefaultThreshold(Number(e.target.value))}
              className="w-full accent-brand-600 dark:accent-orange-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Default Voice Interviewer Persona
            </label>
            <select
              value={defaultVoice}
              onChange={(e) => setDefaultVoice(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Serena (Warm/Professional)">Serena (Warm &amp; Professional)</option>
              <option value="Marcus (Technical/Direct)">Marcus (Technical &amp; Direct)</option>
              <option value="Charlotte (Conversational)">Charlotte (Conversational &amp; Friendly)</option>
            </select>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Auto-Send Assessment Links</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                  Automatically invite candidates who pass initial resume evaluation
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoInvite}
                  onChange={(e) => setAutoInvite(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Anonymize Candidate Resumes</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                  Hide candidate names and personal contact details during early review
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={anonymizeResumes}
                  onChange={(e) => setAnonymizeResumes(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 dark:peer-checked:bg-orange-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="px-6 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>Save General Settings</span>
        </button>
      </div>
    </div>
  );
}
