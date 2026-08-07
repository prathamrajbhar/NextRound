'use client';

import React from 'react';
import { Sparkles, Clock, Mail, User } from 'lucide-react';

interface SidebarProps {
  status: string;
  expiryDate: string;
  orgName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function OfferActionSidebar({
  status,
  expiryDate,
  orgName,
  onAccept,
  onDecline,
}: SidebarProps) {
  const isFinalized = status === 'accepted' || status === 'declined';

  return (
    <aside className="space-y-4 sticky top-6">
      {/* Expiration Countdown Widget */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Clock className="h-3.5 w-3.5 text-amber-500" /> Offer Status
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Action Pending
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-lg font-black text-slate-900 dark:text-white block">
            Expires on {expiryDate}
          </span>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Please sign offer before expiration date.
          </p>
        </div>

        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-amber-500 w-[70%]" title="Time Remaining" />
        </div>
      </div>

      {/* Decision Buttons */}
      {!isFinalized && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Candidate Actions
          </span>

          <button
            type="button"
            onClick={onAccept}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold py-3 text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-emerald-200" />
            Accept & Sign Offer
          </button>

          <button
            type="button"
            onClick={onDecline}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold py-2.5 text-xs transition-all cursor-pointer text-center"
          >
            Decline Offer
          </button>
        </div>
      )}

      {/* Recruiter Contact Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Hiring Team
        </span>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-sm shrink-0 border border-slate-200 dark:border-slate-700">
            <User className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
              Talent Team
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">
              {orgName}
            </span>
          </div>
        </div>

        <div className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <Mail className="h-3.5 w-3.5 text-brand-500" />
          Contact via the platform
        </div>
      </div>
    </aside>
  );
}
