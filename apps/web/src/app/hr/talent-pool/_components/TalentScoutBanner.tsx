'use client';

import React from 'react';
import { Brain } from '@/lib/lucide-google-icons';

interface TalentScoutBannerProps {
  scoutHighMatchCount: number;
  onApplyFilters: () => void;
}

export function TalentScoutBanner({
  scoutHighMatchCount,
  onApplyFilters,
}: TalentScoutBannerProps) {
  return (
    <div className="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-100 dark:border-purple-900/60 rounded-3xl p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
      <div className="flex gap-4 items-start">
        <Brain className="h-9 w-9 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wide">
            AI Sourcing Scout Insights
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold max-w-2xl">
            {scoutHighMatchCount > 0 ? (
              <>
                Found <strong>{scoutHighMatchCount} {scoutHighMatchCount === 1 ? 'candidate' : 'candidates'}</strong>{' '}
                exceeding a 90% semantic match with the active job rubric. Profile scoring and semantic matching completed.
              </>
            ) : (
              'No candidates currently exceed a 90% semantic match. Publish jobs or sync profiles to source a stronger pool.'
            )}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onApplyFilters}
        className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 px-4 py-2 text-[10px] font-black text-purple-700 dark:text-purple-300 shadow-sm transition-all whitespace-nowrap cursor-pointer hover:scale-[1.01]"
      >
        Apply Scout Filters
      </button>
    </div>
  );
}
