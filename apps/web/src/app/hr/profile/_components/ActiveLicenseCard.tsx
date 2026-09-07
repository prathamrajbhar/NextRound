'use client';

import React from 'react';
import { FileText, UploadCloud } from '@/lib/lucide-google-icons';

interface ActiveLicenseCardProps {
  licenseName: string;
  onLicenseUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ActiveLicenseCard({ licenseName, onLicenseUpload }: ActiveLicenseCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
      <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2">
        Active License
      </h3>

      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 text-purple-700 dark:text-purple-300 shadow-sm">
        <FileText className="h-5 w-5 flex-shrink-0" />
        <div className="min-w-0 flex-grow">
          <span className="text-xs font-extrabold truncate block leading-none">{licenseName}</span>
          <span className="text-[9px] text-slate-400 dark:text-slate-400 font-semibold block mt-1">
            Validated 2 days ago
          </span>
        </div>
      </div>

      <label className="w-full text-center text-xs font-extrabold text-purple-600 dark:text-purple-400 hover:underline transition-colors py-2 cursor-pointer block border border-dashed border-purple-200 dark:border-purple-800 bg-purple-50/10 dark:bg-purple-950/20 rounded-2xl shadow-inner">
        <UploadCloud className="h-4.5 w-4.5 mx-auto mb-1 text-purple-500 dark:text-purple-400" />
        <span>Replace License file</span>
        <input type="file" accept=".pdf" onChange={onLicenseUpload} className="hidden" />
      </label>
    </div>
  );
}
