'use client';

import React, { useState } from 'react';
import { Clock, ChevronDown } from '@/lib/lucide-google-icons';
import { ProctoringEvent, SEVERITY_COLORS } from './proctoringReport.types';

interface ProctoringTimelineProps {
  events: ProctoringEvent[];
}

export function ProctoringTimeline({ events }: ProctoringTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  const formatElapsed = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        <span>Chronological Telemetry Timeline ({events.length} logs)</span>
        <ChevronDown className={`h-4.5 w-4.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 py-2 space-y-4 max-h-96 overflow-y-auto pt-4">
          {events.map((event) => {
            const severityBadge = SEVERITY_COLORS[event.severity] || SEVERITY_COLORS.info;
            return (
              <div key={event.id} className="relative group text-xs font-semibold">
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
  );
}
