'use client';

import React from 'react';
import { TrendingUp } from '@/lib/lucide-google-icons';
import { CandidateSentimentProfile } from '@/types';

interface EmotionalJourneyGraphProps {
  journeyGraph: CandidateSentimentProfile['journeyGraph'];
}

export function EmotionalJourneyGraph({ journeyGraph }: EmotionalJourneyGraphProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Emotional Journey Graph (Timeline)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Timeline of confidence vs stress across consecutive audio segments of the interview.
        </p>
      </div>

      {journeyGraph.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">
          No audio timeline segments available for this session.
        </p>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Confidence Level
            </span>
            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Stress Level
            </span>
            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Hesitation Index
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {journeyGraph.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-350 dark:hover:border-slate-700 shadow-2xs transition-all space-y-3"
              >
                <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>{item.timeLabel}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-black uppercase text-[8px] ${
                      item.emotionLabel === 'Confident'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                        : item.emotionLabel === 'Hesitant'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800'
                        : item.emotionLabel === 'Neutral'
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350 border border-slate-200/80 dark:border-slate-700'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800'
                    }`}
                  >
                    {item.emotionLabel}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                  Audio Segment {idx + 1}
                </p>

                <div className="space-y-1.5">
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px] text-emerald-400 font-bold">
                      <span>Conf</span> <span>{item.confidence}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${item.confidence}%` }} />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px] text-rose-400 font-bold">
                      <span>Stress</span> <span>{item.stress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full" style={{ width: `${item.stress}%` }} />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px] text-amber-400 font-bold">
                      <span>Hesitation</span> <span>{item.hesitation}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${item.hesitation}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
