'use client';

import React from 'react';
import { XCircle } from '@/lib/lucide-google-icons';

interface CodingStateScreenProps {

  error?: string | null;

  loadingLabel?: string;
}

export function CodingStateScreen({ error, loadingLabel = 'Generating live coding problem via Gemini AI...' }: CodingStateScreenProps) {
  if (error) {
    return (
      <div className="w-full h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center font-sans">
        <div className="max-w-md p-6 bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Generation Failed</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 animate-pulse">
          {loadingLabel}
        </p>
      </div>
    </div>
  );
}
