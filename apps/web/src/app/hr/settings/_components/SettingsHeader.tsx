'use client';

import React from 'react';
import { CheckCircle2 } from '@/lib/lucide-google-icons';

interface SettingsHeaderProps {
  savedSuccess: boolean;
}

export function SettingsHeader({ savedSuccess }: SettingsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
      <div>
        <span className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 uppercase tracking-widest block mb-1">
          HR Settings
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
          Workspace &amp; System Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Configure theme aesthetics, AI screening thresholds, notification alerts, team access, and email templates.
        </p>
      </div>

      {savedSuccess && (
        <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1.5 animate-in zoom-in-95 duration-200 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>Settings Saved Successfully!</span>
        </div>
      )}
    </div>
  );
}
