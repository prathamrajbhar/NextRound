'use client';

import React, { useState } from 'react';
import { Shield, CheckCircle2 } from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';
import {
  ProctoringReport,
  ProctoringViolation,
} from './proctoringReport.types';
import { ProctoringViolationItem } from './ProctoringViolationItem';
import { ProctoringStatsGrid } from './ProctoringStatsGrid';
import { ProctoringTimeline } from './ProctoringTimeline';

export type { ProctoringReport, ProctoringViolation, ProctoringEvent } from './proctoringReport.types';

interface ProctoringReportCardProps {
  report: ProctoringReport;
}

export function ProctoringReportCard({ report }: ProctoringReportCardProps) {
  const [reviewingViolationId, setReviewingViolationId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'acknowledged' | 'false_positive' | 'escalated' | 'resolved'>('acknowledged');
  const [reviewReason, setReviewReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { violations, events } = report;
  const [localViolations, setLocalViolations] = useState<ProctoringViolation[]>(violations);

  const handleReviewSubmit = async (violationId: string) => {
    if (!reviewReason.trim()) return;
    setIsSubmittingReview(true);
    try {
      await apiClient.post(`/proctoring/violations/${violationId}/review`, {
        status: reviewStatus,
        review_reason: reviewReason,
      });
      setLocalViolations((prev) =>
        prev.map((v) =>
          v.id === violationId ? { ...v, status: reviewStatus, review_reason: reviewReason } : v
        )
      );
      setReviewingViolationId(null);
      setReviewReason('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const highRiskViolations = violations.filter((v) => v.severity === 'high');
  const mediumRiskViolations = violations.filter((v) => v.severity === 'medium');

  const statusLabel =
    highRiskViolations.length > 0
      ? 'CRITICAL WARNINGS'
      : mediumRiskViolations.length > 0
      ? 'VETTING FLAGS PENDING'
      : 'SECURITY AUDIT CLEAN';

  const statusBg =
    highRiskViolations.length > 0
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
      : mediumRiskViolations.length > 0
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';

  const tabSwitches = events.filter((e) => e.kind === 'tab_hidden').length;
  const fsExits = events.filter((e) => e.kind === 'fullscreen_exit').length;
  const mediaStops = events.filter((e) => e.kind.endsWith('_stopped')).length;

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand-600 dark:text-orange-400" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
              Hiring Pipeline Security Audit
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
              Isolated Client Telemetry Assessment Log
            </span>
          </div>
        </div>

        <span className={`text-[10px] font-black px-3.5 py-1 rounded-full border tracking-widest ${statusBg}`}>
          {statusLabel}
        </span>
      </div>

      {localViolations.length > 0 ? (
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
            Flagged Security Violations &amp; HR Reviews
          </span>
          <div className="space-y-3">
            {localViolations.map((violation) => (
              <ProctoringViolationItem
                key={violation.id}
                violation={violation}
                isReviewing={reviewingViolationId === violation.id}
                reviewStatus={reviewStatus}
                reviewReason={reviewReason}
                isSubmittingReview={isSubmittingReview}
                onStartReview={() => {
                  setReviewingViolationId(violation.id);
                  setReviewStatus('acknowledged');
                  setReviewReason('');
                }}
                onCancelReview={() => setReviewingViolationId(null)}
                onStatusChange={setReviewStatus}
                onReasonChange={setReviewReason}
                onSubmitReview={() => handleReviewSubmit(violation.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <span>No security violations or focus loss events were flagged by the policy system.</span>
        </div>
      )}

      <ProctoringStatsGrid
        tabSwitches={tabSwitches}
        fsExits={fsExits}
        mediaStops={mediaStops}
      />

      <ProctoringTimeline events={events} />
    </div>
  );
}
