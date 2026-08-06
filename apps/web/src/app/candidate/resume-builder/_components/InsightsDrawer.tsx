'use client';

import React from 'react';
import { Sparkles } from '@/lib/lucide-google-icons';

interface InsightsDrawerProps {
  extractedInsights: { type: string; label: string; value: string }[];
  onClose: () => void;
}

export function InsightsDrawer({ extractedInsights, onClose }: InsightsDrawerProps) {
  return (
    <div className="absolute top-16 right-6 bottom-20 w-80 rounded-2xl bg-slate-900/95 border border-slate-800 backdrop-blur-xl p-4 shadow-2xl z-30 space-y-4 animate-in slide-in-from-right-4 duration-200 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-emerald-400" /> Extracted Highlights
        </span>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white"
        >
          Close ✕
        </button>
      </div>

      <div className="space-y-2">
        {extractedInsights.map((ins, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-0.5">
            <div className="flex justify-between text-[9px] font-black uppercase text-emerald-400">
              <span>{ins.type}</span>
              <span>{ins.label}</span>
            </div>
            <p className="font-bold text-slate-200">{ins.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
