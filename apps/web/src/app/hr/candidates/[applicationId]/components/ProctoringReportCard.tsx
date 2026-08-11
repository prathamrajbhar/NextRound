'use client';

import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  XCircle,
  Clock,
  Video,
  Mic,
  Monitor,
  Activity,
  ChevronDown,
} from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';

export interface ProctoringViolation {
  id: string;
  rule_code: string;
  severity: 'low' | 'medium' | 'high';
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  status: string;
  reviewer_id?: string | null;
  review_reason?: string | null;
}

export interface ProctoringEvent {
  id: string;
  kind: string;
  severity: 'info' | 'warning' | 'low' | 'medium' | 'high';
  source: string;
  client_timestamp: string;
  session_elapsed_ms: number;
  payload_json?: Record<string, unknown>;
}

export interface ProctoringReport {
  session: {
    id: string;
    session_type: string;
    status: string;
    started_at: string;
    ended_at: string | null;
    last_heartbeat_at: string | null;
    candidate_email: string;
  };
  violations: ProctoringViolation[];
  events: ProctoringEvent[];
}

interface ProctoringReportCardProps {
  report: ProctoringReport;
}

export function ProctoringReportCard({ report }: ProctoringReportCardProps) {
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [reviewingViolationId, setReviewingViolationId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'acknowledged' | 'false_positive' | 'escalated' | 'resolved'>('acknowledged');
  const [reviewReason, setReviewReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { session, violations, events } = report;
  const [localViolations, setLocalViolations] = useState<ProctoringViolation[]>(violations);

  const handleReviewSubmit = async (violationId: string) => {
    if (!reviewReason.trim()) return;
    setIsSubmittingReview(true);
    try {
      await apiClient.post(`/proctoring/violations/${violationId}/review`, {
        status: reviewStatus,
        review_reason: reviewReason,
      });
      setLocalViolations(prev =>
        prev.map(v => (v.id === violationId ? { ...v, status: reviewStatus, review_reason: reviewReason } : v))
      );
      setReviewingViolationId(null);
      setReviewReason('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Format elapsed time (ms -> mm:ss)
  const formatElapsed = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Human readable rule name
  const getRuleName = (code: string) => {
    switch (code) {
      case 'repeated_tab_switch':
        return 'Tab Switch Detection';
      case 'fullscreen_exit_review':
        return 'Fullscreen Breach (Critical)';
      case 'fullscreen_exit_warning':
        return 'Fullscreen Breach (Warning)';
      case 'heartbeat_gap':
        return 'Telemetry Gap / Reconnects';
      case 'media_track_disabled':
        return 'Media Track Interruption';
      default:
        return code.replace(/_/g, ' ');
    }
  };

  // Severity color maps
  const severityColors = {
    high: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    medium: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    low: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    warning: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    info: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
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

  // Compute metrics
  const tabSwitches = events.filter((e) => e.kind === 'tab_hidden').length;
  const fsExits = events.filter((e) => e.kind === 'fullscreen_exit').length;
  const mediaStops = events.filter((e) => e.kind.endsWith('_stopped')).length;

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand-600 dark:text-orange-400" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">Hiring Pipeline Security Audit</h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
              Isolated Client Telemetry Assessment Log
            </span>
          </div>
        </div>

        <span className={`text-[10px] font-black px-3.5 py-1 rounded-full border tracking-widest ${statusBg}`}>
          {statusLabel}
        </span>
      </div>

      {/* Main Violation Alert Badges */}
      {localViolations.length > 0 ? (
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
            Flagged Security Violations & HR Reviews
          </span>
          <div className="space-y-3">
            {localViolations.map((violation) => {
              const isPending = violation.status === 'pending_review';
              const isReviewing = reviewingViolationId === violation.id;

              return (
                <div
                  key={violation.id}
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
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                        violation.status === 'pending_review' ? 'bg-amber-500/20 text-amber-500' :
                        violation.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-500' :
                        violation.status === 'false_positive' ? 'bg-slate-500/20 text-slate-400' :
                        violation.status === 'acknowledged' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {violation.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Evidence Metadata */}
                  <div className="text-[10px] opacity-75 space-y-0.5">
                    <div>First Seen: {new Date(violation.first_seen_at).toLocaleTimeString()}</div>
                    <div>Last Seen: {new Date(violation.last_seen_at).toLocaleTimeString()}</div>
                  </div>

                  {/* Review Notes Display */}
                  {violation.review_reason && (
                    <div className="p-2.5 rounded-2xl bg-black/10 border border-black/10 text-[11px] space-y-1">
                      <span className="font-extrabold block text-[9px] opacity-60 uppercase tracking-widest">Reviewer Comments</span>
                      <p className="italic leading-relaxed">{violation.review_reason}</p>
                    </div>
                  )}

                  {/* HR Action controls */}
                  {isPending && !isReviewing && (
                    <button
                      onClick={() => {
                        setReviewingViolationId(violation.id);
                        setReviewStatus('acknowledged');
                        setReviewReason('');
                      }}
                      className="py-1.5 px-3 rounded-xl bg-black/10 hover:bg-black/20 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer block text-center w-fit"
                    >
                      Audit & Review Note
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
                              onClick={() => setReviewStatus(s)}
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
                          onChange={(e) => setReviewReason(e.target.value)}
                          placeholder="Explain false positive validation, security review, or remediation details..."
                          className="w-full p-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-850 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-500"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          disabled={isSubmittingReview || !reviewReason.trim()}
                          onClick={() => handleReviewSubmit(violation.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit Note
                        </button>
                        <button
                          onClick={() => setReviewingViolationId(null)}
                          className="px-4 py-2 rounded-xl bg-black/10 text-slate-500 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer hover:bg-black/20"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <span>No security violations or focus loss events were flagged by the policy system.</span>
        </div>
      )}

      {/* Security Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 p-3 rounded-2xl text-center">
          <Monitor className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mx-auto mb-1.5" />
          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Tab Switches</span>
          <span className={`text-base font-black font-mono block mt-0.5 ${tabSwitches > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'}`}>
            {tabSwitches}
          </span>
        </div>
        <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 p-3 rounded-2xl text-center">
          <Maximize2 className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mx-auto mb-1.5" />
          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Fullscreen Exit</span>
          <span className={`text-base font-black font-mono block mt-0.5 ${fsExits > 0 ? 'text-rose-500 font-bold' : 'text-slate-800 dark:text-slate-100'}`}>
            {fsExits}
          </span>
        </div>
        <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 p-3 rounded-2xl text-center">
          <Video className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mx-auto mb-1.5" />
          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Media Stops</span>
          <span className={`text-base font-black font-mono block mt-0.5 ${mediaStops > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'}`}>
            {mediaStops}
          </span>
        </div>
      </div>

      {/* Expanded Chronological Event Log Timeline */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setTimelineExpanded(!timelineExpanded)}
          className="w-full flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <span>Chronological Telemetry Timeline ({events.length} logs)</span>
          <ChevronDown className={`h-4.5 w-4.5 transition-transform duration-200 ${timelineExpanded ? 'rotate-180' : ''}`} />
        </button>

        {timelineExpanded && (
          <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 py-2 space-y-4 max-h-96 overflow-y-auto pt-4">
            {events.map((event) => {
              const severityBadge = severityColors[event.severity] || severityColors.info;
              return (
                <div key={event.id} className="relative group text-xs font-semibold">
                  {/* Bullet timeline dot */}
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-900 border border-slate-700 ring-4 ring-slate-950" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {formatElapsed(event.session_elapsed_ms)}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 capitalize">
                        {event.kind.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border tracking-wider capitalize ${severityBadge}`}>
                      {event.severity}
                    </span>
                  </div>

                  {event.payload_json && Object.keys(event.payload_json).length > 0 && (
                    <pre className="mt-1.5 p-2 rounded-xl bg-slate-950 text-[10px] font-mono text-slate-400 overflow-x-auto whitespace-pre border border-white/5 max-h-24">
                      {JSON.stringify(event.payload_json, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
