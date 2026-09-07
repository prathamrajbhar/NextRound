'use client';

import React from 'react';
import { Bot, Clock, ArrowLeft, MessageSquare } from '@/lib/lucide-google-icons';

interface InterviewHeaderProps {
  targetRole: string;
  experienceLevel: string;
  timeRemaining: number;
  formatTimer: (sec: number) => string;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onCancelCall?: () => void;
}

export function InterviewHeader({
  targetRole,
  experienceLevel,
  timeRemaining,
  formatTimer,
  isChatOpen,
  onToggleChat,
  onCancelCall,
}: InterviewHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-4">
      <div className="flex items-center gap-3.5">
        {onCancelCall && (
          <button
            type="button"
            onClick={onCancelCall}
            className="p-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold shadow-sm active:scale-95 mr-1"
            title="Cancel interview & return to setup"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0 shadow-inner">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-bold text-white tracking-tight">
              AI Resume Builder Call
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {targetRole} • {experienceLevel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 font-mono text-xs font-bold text-slate-200 shadow-sm">
          <Clock className="h-3.5 w-3.5 text-orange-400" />
          <span>{formatTimer(timeRemaining)}</span>
        </div>

        <button
          type="button"
          onClick={onToggleChat}
          className={`px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
            isChatOpen
              ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
              : 'bg-slate-900/80 border-white/10 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{isChatOpen ? 'Close Messages' : 'Messages'}</span>
        </button>
      </div>
    </div>
  );
}
