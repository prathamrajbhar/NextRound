'use client';

import React from 'react';
import { AlertTriangle } from '@/lib/lucide-google-icons';
import { ProctoringViolation, getRuleName } from './proctoringReport.types';

type ReviewStatus = 'acknowledged' | 'false_positive' | 'escalated' | 'resolved';

interface ProctoringViolationItemProps {
  violation: ProctoringViolation;
  isReviewing: boolean;
  reviewStatus: ReviewStatus;
  reviewReason: string;
  isSubmittingReview: boolean;
  onStartReview: () => void;
  onCancelReview: () => void;
  onStatusChange: (status: ReviewStatus) => void;
  onReasonChange: (reason: string) => void;
  onSubmitReview: () => void;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending_review: 'bg-amber-500/20 text-amber-500',
  resolved: 'bg-emerald-500/20 text-emerald-500',
  false_positive: 'bg-slate-500/20 text-slate-400',
  acknowledged: 'bg-blue-500/20 text-blue-400',
};

export function ProctoringViolationItem({
  violation,
  isReviewing,
  reviewStatus,
  reviewReason,
  isSubmittingReview,
  onStartReview,
  onCancelReview,
  onStatusChange,
  onReasonChange,
  onSubmitReview,
}: ProctoringViolationItemProps) {
  const isPending = violation.status === 'pending_review';
  const badgeClass = STATUS_BADGE_CLASSES[violation.status] || 'bg-rose-500/20 text-rose-400';

  return (
    <div
      className={`p-4 rounded-3xl border space-y-3 transition-all ${
        violation.severity === 'high'
          ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300'
          : 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300'
      }`}
    >
      <div className="flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
          <span className="truncate font-extrabold text-sm">{getRuleName(violation.rule_code)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-black/10 border border-black/10 font-black font-mono">
            {violation.occurrence_count}×
          </span>
          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${badgeClass}`}>
            {violation.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="text-[10px] opacity-75 space-y-0.5">
        <div>First Seen: {new Date(violation.first_seen_at).toLocaleTimeString()}</div>
        <div>Last Seen: {new Date(violation.last_seen_at).toLocaleTimeString()}</div>
      </div>

      {violation.review_reason && (
        <div className="p-2.5 rounded-2xl bg-black/10 border border-black/10 text-[11px] space-y-1">
          <span className="font-extrabold block text-[9px] opacity-60 uppercase tracking-widest">Reviewer Comments</span>
          <p className="italic leading-relaxed">{violation.review_reason}</p>
        </div>
      )}

      {isPending && !isReviewing && (
        <button
          onClick={onStartReview}
          className="py-1.5 px-3 rounded-xl bg-black/10 hover:bg-black/20 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer block text-center w-fit"
        >
          Audit &amp; Review Note
        </button>
      )}

      {isReviewing && (
        <div className="space-y-3 border-t border-black/10 pt-3 text-slate-800 dark:text-slate-200">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Action Type</label>
            <div className="flex flex-wrap gap-1.5">
              {(['acknowledged', 'false_positive', 'escalated', 'resolved'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(s)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    reviewStatus === s
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-black/10 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-black/20'
                  }`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Reviewer Notes</label>
            <textarea
              rows={2}
              value={reviewReason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Explain false positive validation, security review, or remediation details..."
              className="w-full p-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-850 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              disabled={isSubmittingReview || !reviewReason.trim()}
              onClick={onSubmitReview}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Note
            </button>
            <button
              onClick={onCancelReview}
              className="px-4 py-2 rounded-xl bg-black/10 text-slate-500 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer hover:bg-black/20"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
