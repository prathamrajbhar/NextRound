'use client';

import React from 'react';
import { Application } from '@/types';
import {
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
} from '@/lib/lucide-google-icons';

interface ScreeningAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: Application;
  runningScreening: boolean;
  screeningError: string | null;
  onRunScreening: () => void;
}

export function ScreeningAgentModal({
  isOpen,
  onClose,
  app,
  runningScreening,
  screeningError,
  onRunScreening,
}: ScreeningAgentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-6 w-6 animate-pulse" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-display">
                AI Resume Screening Agent
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Candidate qualification &amp; skills matching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-medium text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-900/80 space-y-2">
            <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-200 font-extrabold text-xs">
              <span>Application Status</span>
              <span className="capitalize px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-[10px]">
                {app.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-indigo-800 dark:text-indigo-300">
              The AI Screening Agent evaluates your resume skills and experience level against {app.jobTitle}&apos;s requirements and rubric.
            </p>
          </div>

          {screeningError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{screeningError}</span>
            </div>
          )}

          {app.status === 'screening_completed' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/80 space-y-2 text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2 font-extrabold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>Screening Passed!</span>
              </div>
              {app.reasoning && (
                <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300 font-medium whitespace-pre-wrap">
                  {app.reasoning}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {app.status === 'rejected' && (
                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2 text-rose-900 dark:text-rose-200">
                  <div className="flex items-center gap-2 font-extrabold text-rose-700 dark:text-rose-400">
                    <XCircle className="h-5 w-5" />
                    <span>Screening Rejected</span>
                  </div>
                  {app.reasoning && (
                    <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300 font-medium whitespace-pre-wrap">
                      {app.reasoning}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Click below to execute or re-evaluate your candidate profile using the Gemini AI screening agent:
                </p>
                <button
                  onClick={onRunScreening}
                  disabled={runningScreening}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-extrabold py-3 text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {runningScreening ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>AI Agent Parsing Profile...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span>Run / Re-check AI Screening</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
