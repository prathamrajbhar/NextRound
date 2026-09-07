'use client';

import React, { useState } from 'react';
import { Camera } from '@/lib/lucide-google-icons';
import { EvidenceSnapshot } from './evidenceReview.types';

interface EvidenceSnapshotsSectionProps {
  snapshots: EvidenceSnapshot[];
}

export function EvidenceSnapshotsSection({ snapshots }: EvidenceSnapshotsSectionProps) {
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  return (
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
              <img
                src={snap.url}
                alt={`Camera snapshot ${new Date(snap.captured_at).toLocaleTimeString()}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
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
