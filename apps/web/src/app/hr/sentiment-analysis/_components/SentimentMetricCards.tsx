'use client';

import React from 'react';
import { Sparkles, Volume2, Clock } from '@/lib/lucide-google-icons';
import { CandidateSentimentProfile } from '@/types';

interface SentimentMetricCardsProps {
  profile: CandidateSentimentProfile;
}

export function SentimentMetricCards({ profile }: SentimentMetricCardsProps) {
  const stressScore = profile.overallStressScore ?? 100;
  const isLowStress = stressScore < 30;
  const isModerateStress = stressScore < 60;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Stress Index</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
              isLowStress
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                : isModerateStress
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200'
            }`}
          >
            {isLowStress ? 'Low Stress' : isModerateStress ? 'Moderate' : 'High Stress'}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{profile.overallStressScore}</span>
          <span className="text-xs text-slate-400 font-semibold">/ 100 max</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isLowStress ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${profile.overallStressScore}%` }}
          />
        </div>
      </div>

      <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Confidence Rating</span>
          <Sparkles className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{profile.confidenceRating}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${profile.confidenceRating}%` }} />
        </div>
      </div>

      <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Speech Articulation</span>
          <Volume2 className="h-4 w-4 text-orange-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{profile.speechClarityScore}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${profile.speechClarityScore}%` }} />
        </div>
      </div>

      <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Avg Pause Cadence</span>
          <Clock className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{profile.avgPauseDurationSec}s</span>
          <span className="text-xs text-slate-400 font-semibold">avg</span>
        </div>
        <p className="text-[10px] text-slate-400 font-medium">Optimal response pause window is 0.8s - 1.8s</p>
      </div>
    </div>
  );
}
