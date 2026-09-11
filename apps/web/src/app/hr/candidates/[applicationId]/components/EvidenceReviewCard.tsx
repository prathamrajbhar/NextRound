'use client';

import React from 'react';
import { Activity, AlertTriangle } from '@/lib/lucide-google-icons';
import {
  EvidenceRecording,
  EvidenceSnapshot,
  ProctoringSummary,
  fmtMs,
  riskColor,
  riskBar,
} from './evidenceReview.types';
import { EvidenceAudioSection } from './EvidenceAudioSection';
import { EvidenceSnapshotsSection } from './EvidenceSnapshotsSection';

export type { EvidenceRecording, EvidenceSnapshot, ProctoringSummary } from './evidenceReview.types';

interface EvidenceReviewCardProps {
  recording?: EvidenceRecording | null;
  evidence?: EvidenceSnapshot[];
  riskScore?: number | null;
  summary?: ProctoringSummary | null;
}

export function EvidenceReviewCard({
  recording,
  evidence,
  riskScore,
  summary,
}: EvidenceReviewCardProps) {
  const snapshots = (evidence || []).filter((e) => e.kind === 'camera_snapshot');
  const audioRecording =
    recording || (evidence || []).find((e) => e.kind === 'audio_recording') || null;

  const metrics: Array<{ label: string; value: string; warn?: boolean }> = [
    { label: 'Face Missing', value: fmtMs(summary?.totalFaceMissingMs), warn: (summary?.totalFaceMissingMs ?? 0) > 5000 },
    { label: 'Multiple Faces', value: fmtMs(summary?.totalMultipleFacesMs), warn: (summary?.totalMultipleFacesMs ?? 0) > 0 },
    { label: 'Voice Events', value: String(summary?.multipleVoicesCount ?? 0), warn: (summary?.multipleVoicesCount ?? 0) > 0 },
    { label: 'Noise Spikes', value: String(summary?.backgroundNoiseHighCount ?? 0), warn: (summary?.backgroundNoiseHighCount ?? 0) > 0 },
    { label: 'Tab Switches', value: String(summary?.tabSwitchCount ?? 0), warn: (summary?.tabSwitchCount ?? 0) > 0 },
    { label: 'Copy/Paste', value: String(summary?.copyPasteActivityCount ?? 0), warn: (summary?.copyPasteActivityCount ?? 0) > 0 },
  ];

  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-600 dark:text-orange-400" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
              Integrity Evidence &amp; Recording
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
              Stored audio &amp; camera proof for this assessment
            </span>
          </div>
        </div>

        {typeof riskScore === 'number' && (
          <div className={`px-3.5 py-1.5 rounded-full border text-center ${riskColor(riskScore)}`}>
            <span className="block text-base font-black font-mono leading-none">{riskScore}</span>
            <span className="text-[8px] font-black uppercase tracking-widest">Risk Score</span>
          </div>
        )}
      </div>

      {typeof riskScore === 'number' && (
        <div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            <span>Cheating Risk Index</span>
            <span>{riskScore >= 60 ? 'High' : riskScore >= 30 ? 'Review' : 'Low'}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${riskBar(riskScore)}`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>
      )}

      <EvidenceAudioSection audioRecording={audioRecording} />

      <EvidenceSnapshotsSection snapshots={snapshots} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`p-2.5 rounded-xl border text-center ${
              m.warn
                ? 'border-amber-500/30 bg-amber-500/5'
                : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40'
            }`}
          >
            <span className={`text-base font-black font-mono block ${m.warn ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'}`}>
              {m.value}
            </span>
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-0.5">
              {m.label}
            </span>
          </div>
        ))}
      </div>

      {summary?.suspiciousBehaviorPattern && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Rapid suspicious behavior pattern detected within a short window.
        </div>
      )}
    </div>
  );
}
