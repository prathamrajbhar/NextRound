'use client';

import React from 'react';
import { Terminal } from '@/lib/lucide-google-icons';

interface AgentLogsPanelProps {
  logs: string[];
}

export default function AgentLogsPanel({ logs }: AgentLogsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Terminal className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
          Agent Logs (Streaming)
        </h3>
        <div className="flex items-center gap-1.5 select-none bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 rounded-full px-2 py-0.5 shadow-sm text-[9px] text-emerald-800 dark:text-emerald-300 font-extrabold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse block animate-duration-1000" />
          LIVE FEED
        </div>
      </div>

      <div className="rounded-2xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-4 shadow-md backdrop-blur-md glass-panel text-[10px] text-slate-700 dark:text-slate-200 space-y-2 h-[350px] overflow-y-auto font-mono scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {logs.length > 0 ? (
          logs.map((log, idx) => (
            <div
              key={idx}
              className="leading-relaxed border-b border-slate-200/60 dark:border-slate-800 pb-2 last:border-0 font-semibold animate-in slide-in-from-top-1 duration-150"
            >
              <span className="text-purple-600 dark:text-orange-400 font-extrabold select-none">&gt;&nbsp;</span>
              {log}
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500 font-semibold">
            <span className="block italic select-none">No logs recorded yet.</span>
            <span className="block text-[9px] mt-0.5 select-none">Agent activities will appear here.</span>
          </div>
        )}
      </div>
    </div>
  );
}
