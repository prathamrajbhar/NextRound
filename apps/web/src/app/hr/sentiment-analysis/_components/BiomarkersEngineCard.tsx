'use client';

import React from 'react';
import { Brain } from '@/lib/lucide-google-icons';
import { CandidateSentimentProfile } from '@/types';

interface BiomarkersEngineCardProps {
  biomarkers: NonNullable<CandidateSentimentProfile['biomarkers']>;
}

export function BiomarkersEngineCard({ biomarkers }: BiomarkersEngineCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Brain className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        Audio Prosody Biomarkers Engine
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-300">Audio Tone Harmony</span>
            <span className="text-emerald-600 dark:text-emerald-400">{biomarkers.audioTone.steadyPercent}%</span>
          </div>
          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{biomarkers.audioTone.status}</p>
          <p className="text-[10px] text-slate-400">
            Micro-tremor frequency: {biomarkers.audioTone.tremorPercent}%
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-300">Speech Velocity (WPM)</span>
            <span className="text-orange-600 dark:text-orange-400">{biomarkers.speechPace.wpm} WPM</span>
          </div>
          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{biomarkers.speechPace.status}</p>
          <p className="text-[10px] text-slate-400">Target Range: {biomarkers.speechPace.idealRange}</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-300">Pitch Micro-variance</span>
            <span className="text-blue-600 dark:text-blue-400">{biomarkers.pitchVariation.hzStdDev} Hz</span>
          </div>
          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{biomarkers.pitchVariation.status}</p>
          <p className="text-[10px] text-slate-400">Pitch stability index within normal bounds</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-300">Pause Patterns</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {biomarkers.pausePatterns.pausesPerMin}/min
            </span>
          </div>
          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{biomarkers.pausePatterns.status}</p>
          <p className="text-[10px] text-slate-400">
            Long stall pauses (&gt;3s): {biomarkers.pausePatterns.longPauseCount}
          </p>
        </div>
      </div>
    </div>
  );
}
