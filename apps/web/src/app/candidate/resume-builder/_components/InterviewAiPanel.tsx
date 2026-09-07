'use client';

import React from 'react';
import { Bot, Sparkles, Volume2 } from '@/lib/lucide-google-icons';

interface InterviewAiPanelProps {
  aiState: 'speaking' | 'listening' | 'evaluating';
  currentTurn: { aiMessage: string };
  realtimeInsight?: string | null;
  onReplayAudio?: () => void;
  isChatOpen: boolean;
}

export function InterviewAiPanel({
  aiState,
  currentTurn,
  realtimeInsight,
  onReplayAudio,
  isChatOpen,
}: InterviewAiPanelProps) {
  return (
    <div
      className={`${
        isChatOpen ? 'lg:col-span-4' : 'lg:col-span-6'
      } rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-5 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur-md">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              aiState === 'speaking'
                ? 'bg-orange-400 animate-pulse'
                : aiState === 'evaluating'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-400 animate-pulse'
            }`}
          />
          {aiState === 'speaking'
            ? 'AI Lead Speaking'
            : aiState === 'evaluating'
            ? 'AI Reviewing Response'
            : 'AI Listening'}
        </div>

        <div className="flex items-center gap-1 h-4 px-2 bg-slate-950/50 rounded-full border border-white/5 backdrop-blur-md">
          {[45, 80, 55, 95, 65, 85].map((h, i) => (
            <div
              key={i}
              className={`w-0.5 rounded-full transition-all ${
                aiState === 'speaking' ? 'bg-orange-400 animate-pulse' : 'bg-slate-700'
              }`}
              style={{ height: aiState === 'speaking' ? `${h}%` : '30%' }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center my-4 relative min-h-[220px]">
        <div
          className={`h-24 w-24 rounded-3xl bg-slate-950/90 border border-white/10 backdrop-blur-md flex items-center justify-center text-orange-400 shadow-xl transition-all ${
            aiState === 'speaking'
              ? 'border-orange-500/50 bg-orange-500/10 scale-105 shadow-orange-500/20'
              : ''
          }`}
        >
          <Bot className="h-11 w-11" />
        </div>
        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mt-4 block">
          AI Interviewer Lead
        </span>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 space-y-2 relative shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> AI Interviewer Spoken Dialogue
            </span>
            {onReplayAudio && (
              <button
                type="button"
                onClick={onReplayAudio}
                className="flex items-center gap-1 text-[10px] font-semibold text-slate-300 hover:text-white transition-all px-2 py-0.5 rounded-lg bg-slate-800/80 border border-white/10 cursor-pointer active:scale-95"
              >
                <Volume2 className="h-3 w-3" />
                <span>Replay</span>
              </button>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-100 leading-relaxed">
            &ldquo;{currentTurn.aiMessage}&rdquo;
          </p>
        </div>

        {realtimeInsight && (
          <div className="p-2.5 rounded-xl bg-amber-500/5 backdrop-blur-md border border-amber-500/20 text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 block">
              ✦ Extraction Insight
            </span>
            <p className="text-[11px] font-medium text-amber-200 mt-0.5">{realtimeInsight}</p>
          </div>
        )}
      </div>
    </div>
  );
}
