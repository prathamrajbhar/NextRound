'use client';

import React from 'react';
import { Save, CheckCircle2, AlertCircle } from '@/lib/lucide-google-icons';

interface ProfileHeaderProps {
  saving: boolean;
  detailsSaved: boolean;
  saveError: string;
  loadError?: string;
  onSave: () => void;
}

export function ProfileHeader({
  saving,
  detailsSaved,
  saveError,
  loadError,
  onSave,
}: ProfileHeaderProps) {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 uppercase tracking-widest block">
            AI Profile Studio
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
            Candidate Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Manage your personal details, AI interview preferences, and target compensation.
          </p>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving Profile...' : 'Save Profile Details'}
        </button>
      </div>

      {detailsSaved && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>Profile successfully updated and synced across recruiter applications!</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {loadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Could not load your profile from the server — {loadError}. You can still update it below and save.</span>
        </div>
      )}
    </>
  );
}
