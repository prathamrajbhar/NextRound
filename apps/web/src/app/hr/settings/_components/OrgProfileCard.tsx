'use client';

import React from 'react';
import { Building2 } from '@/lib/lucide-google-icons';

interface OrgProfileCardProps {
  orgName: string;
  setOrgName: (val: string) => void;
  orgDomain: string;
  setOrgDomain: (val: string) => void;
  supportEmail: string;
  setSupportEmail: (val: string) => void;
  timezone: string;
  setTimezone: (val: string) => void;
}

export function OrgProfileCard({
  orgName,
  setOrgName,
  orgDomain,
  setOrgDomain,
  supportEmail,
  setSupportEmail,
  timezone,
  setTimezone,
}: OrgProfileCardProps) {
  return (
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
  );
}
