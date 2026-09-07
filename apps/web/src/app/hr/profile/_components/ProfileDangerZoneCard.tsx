'use client';

import React from 'react';
import { AlertTriangle, Trash2 } from '@/lib/lucide-google-icons';

interface ProfileDangerZoneCardProps {
  deleted: boolean;
  isDeleting: boolean;
  onDeleteData: () => void;
}

export function ProfileDangerZoneCard({
  deleted,
  isDeleting,
  onDeleteData,
}: ProfileDangerZoneCardProps) {
  return (
    <div className="rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 p-6 shadow-sm glass-panel space-y-4">
      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="text-sm font-black">Danger Zone</h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
        Under corporate workspace directives, you have the right to request deletion of all organizational client metadata, active job postings, and historical evaluation logs.
      </p>
      {deleted ? (
        <div className="text-xs font-bold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 p-3 rounded-xl border border-rose-100 dark:border-rose-900/60">
          Purge request logged. Core systems cleanup initiated.
        </div>
      ) : (
        <button
          onClick={onDeleteData}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? 'Processing purge request...' : 'Purge Client Workspace'}
        </button>
      )}
    </div>
  );
}
