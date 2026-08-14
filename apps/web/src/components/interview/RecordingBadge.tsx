'use client';

import React from 'react';
import { Mic } from '@/lib/lucide-google-icons';

interface RecordingBadgeProps {
  active: boolean;
  durationMs: number;
}

function formatDuration(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function RecordingBadge({ active, durationMs }: RecordingBadgeProps) {
  if (!active && durationMs === 0) return null;

  return (
    <div
      className={`fixed top-3 right-3 z-50 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm backdrop-blur-md ${
        active
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
          : 'bg-slate-900/60 border-slate-700 text-slate-400'
      }`}
    >
      <span className="relative flex h-2 w-2">
        {active && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${active ? 'bg-rose-500' : 'bg-slate-500'}`} />
      </span>
      <Mic className="h-3.5 w-3.5" />
      <span className="font-mono text-[10px] font-black tracking-wider">
        {active ? `REC ${formatDuration(durationMs)}` : 'REC PENDING'}
      </span>
    </div>
  );
}