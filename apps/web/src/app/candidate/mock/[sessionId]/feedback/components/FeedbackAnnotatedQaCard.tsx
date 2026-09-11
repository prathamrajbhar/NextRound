'use client';

import React from 'react';
import { Layers, CheckCircle2 } from '@/lib/lucide-google-icons';
import type { QaTranscriptItem } from './feedback.types';

interface FeedbackAnnotatedQaCardProps {
  transcript: QaTranscriptItem[];
}

export function FeedbackAnnotatedQaCard({ transcript }: FeedbackAnnotatedQaCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-brand-600 dark:text-orange-400" />
          Annotated Session Q&amp;A Breakdown
        </h3>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {transcript.length} Responses Evaluated
        </span>
      </div>

      {transcript.length > 0 ? (
        <div className="space-y-6">
          {transcript.map((item, idx) => (
            <div
              key={idx}
              className="space-y-3 pb-5 border-b border-slate-200/60 dark:border-slate-800/60 last:border-none last:pb-0"
            >
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-orange-950/60 border border-brand-200/60 dark:border-orange-900/60 text-[10px] font-extrabold text-brand-700 dark:text-orange-300 uppercase">
                  Question {idx + 1}
                </span>
              </div>

              <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-relaxed font-display">
                {item.question}
              </h4>

              <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 p-4 rounded-2xl text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block mb-1">
                  Candidate Response
                </span>
                {item.answer}
              </div>

              <div className="flex items-start gap-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/60 text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-slate-100">Evaluator Calibration: </strong>
                  {item.feedback}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          No recorded Q&amp;A responses found for this session.
        </div>
      )}
    </div>
  );
}
