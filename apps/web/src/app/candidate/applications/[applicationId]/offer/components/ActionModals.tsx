'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, PenTool, AlertTriangle } from 'lucide-react';

interface ActionModalsProps {
  showAccept: boolean;
  showDecline: boolean;
  onCloseAccept: () => void;
  onCloseDecline: () => void;
  onConfirmAccept: () => void;
  onConfirmDecline: (reason: string) => void;
  orgName: string;
  candidateName: string;
  joiningDate: string;
}

export function ActionModals({
  showAccept,
  showDecline,
  onCloseAccept,
  onCloseDecline,
  onConfirmAccept,
  onConfirmDecline,
  orgName,
  candidateName,
  joiningDate,
}: ActionModalsProps) {
  const [signatureText, setSignatureText] = useState(candidateName);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [declineReason, setDeclineReason] = useState('');

  if (!showAccept && !showDecline) return null;

  return (
    <>
      {/* Accept & Sign Modal */}
      {showAccept && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-7 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Sign & Accept Offer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                By signing below, you accept the employment terms with{' '}
                <strong className="text-slate-900 dark:text-white">{orgName}</strong> starting on{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">{joiningDate}</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Type Full Legal Signature:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-serif italic text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                  placeholder="e.g. Ananya Iyer"
                />
                <PenTool className="h-4 w-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>

              <label className="flex items-start gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>I confirm that I have reviewed the offer document and agree to all terms.</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={!agreeTerms || !signatureText.trim()}
                onClick={onConfirmAccept}
                className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-3 text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Confirm Signature & Accept
              </button>
              <button
                type="button"
                onClick={onCloseAccept}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-4 py-3 text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Offer Modal */}
      {showDecline && (
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
                onClick={() => onConfirmDecline(declineReason)}
                className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 text-xs shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
              >
                Confirm Decline
              </button>
              <button
                type="button"
                onClick={onCloseDecline}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-4 py-3 text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
