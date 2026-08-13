'use client';

import React from 'react';
import { Calendar, ShieldCheck, FileText, Download, Eye, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface PerksTimelineProps {
  joiningDate: string;
  expiryDate: string;
  benefits: string[];
  status: string;
  onOpenPdf: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

export function OfferPerksTimeline({
  joiningDate,
  expiryDate,
  benefits,
  status,
  onOpenPdf,
  onAccept,
  onDecline,
}: PerksTimelineProps) {
  const isFinalized = status === 'accepted' || status === 'declined';

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-7 shadow-xl backdrop-blur-xl space-y-6">
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {}
        <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
            <Calendar className="h-4.5 w-4.5 text-brand-500" />
            Key Dates & Timeline
          </div>
          <div className="space-y-3 text-xs font-semibold">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Target Start Date</span>
              <span className="text-slate-900 dark:text-white font-bold text-sm">{joiningDate}</span>
            </div>
            <div className="flex justify-between items-center bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Offer Expiration</span>
              </div>
              <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">{expiryDate}</span>
            </div>
          </div>
        </div>

        {}
        <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
            Benefits & Health Perks
          </div>
          <ul className="space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700 shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Official Offer Letter PDF Document
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Employment offer document
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onOpenPdf}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-brand-500" />
            Preview Letter
          </button>
          <button
            type="button"
            className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {}
      {!isFinalized && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold py-3.5 text-xs shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-emerald-200" />
            Accept & Sign Offer
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 px-6 text-xs transition-all cursor-pointer text-center"
          >
            Decline Offer
          </button>
        </div>
      )}
    </div>
  );
}
