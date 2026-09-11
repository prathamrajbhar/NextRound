'use client';

import React from 'react';
import { Loader2, AlertCircle, Sparkles, RotateCcw } from '@/lib/lucide-google-icons';

export function LoadingSessionView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[500px]">
      <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
      <p className="text-xs text-slate-500 font-semibold">Loading practice session data...</p>
    </div>
  );
}

export function SessionAccessDeniedView({
  sessionError,
  onGoBack,
}: {
  sessionError: string;
  onGoBack: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[500px] p-4 text-center">
      <AlertCircle className="h-12 w-12 text-rose-500" />
      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Access Denied</h3>
      <p className="text-xs text-slate-500 max-w-sm font-semibold leading-relaxed">
        {sessionError}
      </p>
      <button
        onClick={onGoBack}
        className="mt-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
      >
        Go Back
      </button>
    </div>
  );
}

export function ResumeGeneratingView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6 min-h-[500px]">
      <div className="relative flex items-center justify-center">
        <Loader2 className="h-16 w-16 text-orange-500 animate-spin" />
        <Sparkles className="absolute h-6 w-6 text-amber-400 animate-pulse" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-display">
          AI Resumé Generation in Progress
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          NextRound is processing your voice transcript, quantifying impact metrics, and compiling an ATS-optimized ReportLab PDF. This will take a moment...
        </p>
      </div>
    </div>
  );
}

export function ResumeErrorView({
  onRetry,
  onStartNew,
}: {
  onRetry: () => void;
  onStartNew: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[500px]">
      <AlertCircle className="h-14 w-14 text-rose-500" />
      <div className="text-center space-y-1 max-w-md">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          Generation Timed Out
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          The AI worker experienced a temporary timeout or connection delay. You can retry generating your ATS resumé directly without losing your interview transcript.
        </p>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          Retry Generation
        </button>
        <button
          onClick={onStartNew}
          className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
}
