'use client';

import React from 'react';
import { AlertCircle } from '@/lib/lucide-google-icons';

interface ConsoleExitConfirmProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  candidateResponseCount?: number;
}

export function ConsoleExitConfirm({
  isOpen,
  onCancel,
  onConfirm,
  candidateResponseCount = 0,
}: ConsoleExitConfirmProps) {
  if (!isOpen) return null;

  const isZeroResponses = candidateResponseCount === 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl">
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mx-auto ${
          isZeroResponses
            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-white font-display">
            {isZeroResponses ? 'End Incomplete Session?' : 'Confirm End Session?'}
          </h3>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {isZeroResponses
              ? 'You have not submitted any responses or spoken to the interviewer yet. Ending now will record this session as incomplete with 0% score.'
              : 'Are you sure you want to finish and submit your interview session for evaluation?'}
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-2xl border border-slate-700 bg-slate-800/80 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer transition-all"
          >
            {isZeroResponses ? 'Continue Practice' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-2xl text-white text-xs font-black shadow-md cursor-pointer transition-all ${
              isZeroResponses
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isZeroResponses ? 'End Anyway' : 'End Call'}
          </button>
        </div>
      </div>
    </div>
  );
}
