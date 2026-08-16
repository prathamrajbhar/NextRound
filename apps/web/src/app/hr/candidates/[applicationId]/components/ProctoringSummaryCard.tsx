'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Video,
  Maximize2,
  Monitor,
  AudioLines,
} from '@/lib/lucide-google-icons';
import type { ProctoringReport } from './ProctoringReportCard';

interface ProctoringSummaryCardProps {
  applicationId: string;
  report: ProctoringReport | null;
}

export function ProctoringSummaryCard({ applicationId, report }: ProctoringSummaryCardProps) {
  const hasReport = !!report && report.session.status === 'ended';
  const violations = report?.violations ?? [];
  const events = report?.events ?? [];
  const highRisk = violations.filter((v) => v.severity === 'high').length;
  const mediumRisk = violations.filter((v) => v.severity === 'medium').length;
  const pendingReview = violations.filter((v) => v.status === 'pending_review').length;

  const tabSwitches = events.filter((e) => e.kind === 'tab_hidden').length;
  const fsExits = events.filter((e) => e.kind === 'fullscreen_exit').length;
  const mediaStops = events.filter((e) => e.kind.endsWith('_stopped')).length;

  const flagCount = highRisk + mediumRisk;
  const riskScore = report?.risk_score ?? null;

  const statusStyles =
    flagCount > 0
      ? 'border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400'
      : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400';

  const icon = flagCount > 0 ? (
    <AlertTriangle className="h-5 w-5" />
  ) : (
    <CheckCircle2 className="h-5 w-5" />
  );

  return (
    <div className={`rounded-3xl border p-5 shadow-md backdrop-blur-md glass-panel space-y-3 font-sans ${statusStyles}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h4 className="text-sm font-extrabold font-display">Proctoring Security Audit</h4>
        </div>
        <span className="text-[10px] font-black px-3 py-1 rounded-full border tracking-widest uppercase">
          {hasReport ? (flagCount > 0 ? `${flagCount} Flag${flagCount === 1 ? '' : 's'}` : 'Clean') : 'Pending'}
        </span>
      </div>

      {!hasReport ? (
        <div className="flex items-center gap-2.5 text-xs font-semibold opacity-80">
          {icon}
          <span>No completed proctored session on record for this candidate yet.</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Risk Score</span>
            <span className="text-xs font-black font-mono">
              {riskScore !== null && riskScore !== undefined ? `${Math.round(riskScore)}/100` : '—'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-black/10 dark:bg-slate-800/40 border border-white/5 p-2 text-center">
              <AlertTriangle className="h-4 w-4 mx-auto mb-1 opacity-70" />
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 block">Violations</span>
              <span className={`text-sm font-black font-mono ${flagCount > 0 ? 'text-rose-500' : ''}`}>{flagCount}</span>
            </div>
            <div className="rounded-xl bg-black/10 dark:bg-slate-800/40 border border-white/5 p-2 text-center">
              <Monitor className="h-4 w-4 mx-auto mb-1 opacity-70" />
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 block">Tab Switch</span>
              <span className={`text-sm font-black font-mono ${tabSwitches > 0 ? 'text-amber-500' : ''}`}>{tabSwitches}</span>
            </div>
            <div className="rounded-xl bg-black/10 dark:bg-slate-800/40 border border-white/5 p-2 text-center">
              <Maximize2 className="h-4 w-4 mx-auto mb-1 opacity-70" />
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 block">Fullscreen Exit</span>
              <span className={`text-sm font-black font-mono ${fsExits > 0 ? 'text-rose-500' : ''}`}>{fsExits}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-[11px] font-semibold opacity-80">
            <Video className="h-4 w-4 flex-shrink-0" />
            <span>Media stops: {mediaStops}</span>
            <span className="mx-0.5">•</span>
            <AudioLines className="h-4 w-4 flex-shrink-0" />
            <span>Pending review: {pendingReview}</span>
          </div>

          <Link
            href={`/hr/candidates/${applicationId}/scoring`}
            className="w-full py-2.5 rounded-xl bg-white/60 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-700 text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="h-4 w-4" />
            View Full Security Report
          </Link>
        </div>
      )}
    </div>
  );
}
