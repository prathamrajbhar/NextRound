'use client';

import React, { useState } from 'react';
import { Mic, Camera, Download, Activity, AudioLines, AlertTriangle, Clock } from '@/lib/lucide-google-icons';

export interface EvidenceRecording {
  url: string;
  duration_ms?: number | null;
  size_bytes?: number | null;
}

export interface EvidenceSnapshot {
  id: string;
  kind: string;
  mime_type: string;
  url: string;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  duration_ms?: number | null;
  captured_at: string;
  payload_json?: Record<string, unknown>;
}

export interface ProctoringSummary {
  tabSwitchCount?: number;
  totalHiddenDurationMs?: number;
  fullscreenExitCount?: number;
  totalOutsideFullscreenMs?: number;
  maxHeartbeatGapMs?: number;
  cameraOffDurationMs?: number;
  micOffDurationMs?: number;
  totalFaceMissingMs?: number;
  totalMultipleFacesMs?: number;
  multipleVoicesCount?: number;
  backgroundNoiseHighCount?: number;
  copyPasteActivityCount?: number;
  suspiciousBehaviorPattern?: boolean;
}

interface EvidenceReviewCardProps {
  recording?: EvidenceRecording | null;
  evidence?: EvidenceSnapshot[];
  riskScore?: number | null;
  summary?: ProctoringSummary | null;
}

const fmtMs = (ms?: number | null) => {
  if (!ms && ms !== 0) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, '0')}s`;
};

const fmtBytes = (bytes?: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const riskColor = (score: number) => {
  if (score >= 60) return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
  if (score >= 30) return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
  return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
};

const riskBar = (score: number) => {
  if (score >= 60) return 'bg-rose-500';
  if (score >= 30) return 'bg-amber-500';
  return 'bg-emerald-500';
};

export function EvidenceReviewCard({ recording, evidence, riskScore, summary }: EvidenceReviewCardProps) {
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const snapshots = (evidence || []).filter((e) => e.kind === 'camera_snapshot');
  const audioRecording = recording || (evidence || []).find((e) => e.kind === 'audio_recording') || null;

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
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">Integrity Evidence &amp; Recording</h3>
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
            <div className={`h-full rounded-full transition-all duration-500 ${riskBar(riskScore)}`} style={{ width: `${riskScore}%` }} />
          </div>
        </div>
      )}

      {audioRecording ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <Mic className="h-4 w-4 text-brand-600 dark:text-orange-400" />
            Candidate Audio Recording
          </div>
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-3.5 space-y-2">
            <audio controls preload="metadata" src={audioRecording.url} className="w-full h-10" />
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {fmtMs(audioRecording.duration_ms)}
              </span>
              <span>{fmtBytes(audioRecording.size_bytes)}</span>
              <a
                href={audioRecording.url}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2">
          <AudioLines className="h-4 w-4 text-slate-400" />
          No audio recording was captured for this session.
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <Camera className="h-4 w-4 text-brand-600 dark:text-orange-400" />
          Camera Evidence Snapshots ({snapshots.length})
        </div>

        {snapshots.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {snapshots.map((snap) => (
              <button
                key={snap.id}
                type="button"
                onClick={() => setZoomUrl(snap.url)}
                className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer group"
                aria-label="Open camera snapshot"
              >
                <img src={snap.url} alt={`Camera snapshot ${new Date(snap.captured_at).toLocaleTimeString()}`} className="h-full w-full object-cover" loading="lazy" />
                <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[8px] font-bold px-1.5 py-0.5 text-left">
                  {new Date(snap.captured_at).toLocaleTimeString()}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2">
            <Camera className="h-4 w-4 text-slate-400" />
            No camera snapshots were captured for this session.
          </div>
        )}
      </div>

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

      {zoomUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomUrl(null)}
        >
          <img src={zoomUrl} alt="Camera evidence snapshot" className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
