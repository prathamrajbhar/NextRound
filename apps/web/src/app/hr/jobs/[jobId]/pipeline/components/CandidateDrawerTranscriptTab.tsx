'use client';

import React from 'react';
import { Eye, Zap } from '@/lib/lucide-google-icons';
import { Application } from '@/types';

interface CandidateDrawerTranscriptTabProps {
  app: Application;
}

export function CandidateDrawerTranscriptTab({ app }: CandidateDrawerTranscriptTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Screen Gaze Focus</span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
              {app.engagementSignal ? `${app.engagementSignal.eyeContact}% Direct Contact` : 'No telemetry'}
            </span>
          </div>
          <Eye className="h-5 w-5 text-emerald-500" />
        </div>
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Speech Pacing</span>
            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 block mt-0.5">
              {app.engagementSignal ? app.engagementSignal.speakingRate : 'No telemetry'}
            </span>
          </div>
          <Zap className="h-5 w-5 text-amber-500" />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-2xs">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 dark:border-slate-800 pb-2">
          Interactive Q&amp;A Highlights
        </span>
        {app.transcript && app.transcript.length > 0 ? (
          <div className="space-y-3">
            {app.transcript.slice(0, 5).map((qa, idx) => (
              <div key={idx} className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-brand-600 dark:text-brand-400 uppercase">Question {idx + 1}</span>
                <p className="font-extrabold text-slate-900 dark:text-slate-100">{qa.question}</p>
                <p className="text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs leading-relaxed font-medium">
                  &ldquo;{qa.answer}&rdquo;
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            No interview transcript is available for this candidate.
          </p>
        )}
      </div>
    </div>
  );
}
