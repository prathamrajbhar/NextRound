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

interface ProctoringViolation {
  id: string;
  rule_code: string;
  severity: 'low' | 'medium' | 'high';
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  status: string;
}

interface ProctoringEvent {
  id: string;
  kind: string;
  severity: 'info' | 'warning' | 'low' | 'medium' | 'high';
  source: string;
  client_timestamp: string;
  session_elapsed_ms: number;
  payload_json?: any;
}

interface ProctoringReport {
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

  const { session, violations, events } = report;

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
      case 'screenshare_disabled':
        return 'Screen Sharing Disabled';
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
      {violations.length > 0 ? (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
            Flagged Security Violations
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {violations.map((violation) => (
              <div
                key={violation.id}
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
                  violation.severity === 'high'
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
                  <span className="truncate">{getRuleName(violation.rule_code)}</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-black/10 border border-black/10 font-black font-mono">
                  {violation.occurrence_count}×
                </span>
              </div>
            ))}
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
