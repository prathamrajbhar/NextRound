'use client';

import React from 'react';
import { AlertCircle } from '@/lib/lucide-google-icons';

interface ConsoleExitConfirmProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation overlay shown before ending an interview session.
 */
export function ConsoleExitConfirm({ isOpen, onCancel, onConfirm }: ConsoleExitConfirmProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl">
        <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-white font-display">Confirm End Session?</h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Are you sure you want to finish and submit your interview session?
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-2xl border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md cursor-pointer"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}
