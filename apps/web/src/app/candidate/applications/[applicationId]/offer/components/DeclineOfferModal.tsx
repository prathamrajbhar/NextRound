'use client';

import React, { useState } from 'react';
import { XCircle } from 'lucide-react';

interface DeclineOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  orgName: string;
}

export function DeclineOfferModal({
  isOpen,
  onClose,
  onConfirm,
  orgName,
}: DeclineOfferModalProps) {
  const [declineReason, setDeclineReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
            <XCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Decline Employment Offer
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Please provide feedback for the recruitment team at {orgName}.
          </p>
        </div>

        <textarea
          placeholder="e.g. Accepted another offer / Comp terms were not met..."
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          rows={3}
          className="w-full p-3 text-xs font-medium rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none shadow-inner"
        />

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => onConfirm(declineReason)}
            className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 text-xs shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
          >
            Confirm Decline
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-4 py-3 text-xs transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
