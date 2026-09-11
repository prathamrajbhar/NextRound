'use client';

import React from 'react';
import { Monitor, Maximize2, Video } from '@/lib/lucide-google-icons';

interface ProctoringStatsGridProps {
  tabSwitches: number;
  fsExits: number;
  mediaStops: number;
}

export function ProctoringStatsGrid({
  tabSwitches,
  fsExits,
  mediaStops,
}: ProctoringStatsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 p-3 rounded-2xl text-center">
        <Monitor className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mx-auto mb-1.5" />
        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
          Tab Switches
        </span>
        <span
          className={`text-base font-black font-mono block mt-0.5 ${
            tabSwitches > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          {tabSwitches}
        </span>
      </div>

      <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 p-3 rounded-2xl text-center">
        <Maximize2 className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mx-auto mb-1.5" />
        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
          Fullscreen Exit
        </span>
        <span
          className={`text-base font-black font-mono block mt-0.5 ${
            fsExits > 0 ? 'text-rose-500 font-bold' : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          {fsExits}
        </span>
      </div>

      <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 p-3 rounded-2xl text-center">
        <Video className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mx-auto mb-1.5" />
        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
          Media Stops
        </span>
        <span
          className={`text-base font-black font-mono block mt-0.5 ${
            mediaStops > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          {mediaStops}
        </span>
      </div>
    </div>
  );
}
