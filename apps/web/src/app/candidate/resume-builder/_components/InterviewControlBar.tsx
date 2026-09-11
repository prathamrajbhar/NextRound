'use client';

import React from 'react';
import { Mic, MicOff, Video, VideoOff, MessageSquare, X } from '@/lib/lucide-google-icons';

interface InterviewControlBarProps {
  micActive: boolean;
  onToggleMic: () => void;
  camActive: boolean;
  onToggleCam: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onCancelCall?: () => void;
}

export function InterviewControlBar({
  micActive,
  onToggleMic,
  camActive,
  onToggleCam,
  isChatOpen,
  onToggleChat,
  onCancelCall,
}: InterviewControlBarProps) {
  return (
    <div className="mx-auto px-5 py-2.5 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center gap-3 select-none shadow-2xl">
      <button
        type="button"
        onClick={onToggleMic}
        className={`p-2.5 rounded-xl border transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
          micActive
            ? 'bg-slate-800/60 border-white/10 text-slate-200 hover:bg-slate-800'
            : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
        }`}
        title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
      >
        {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </button>

      <button
        type="button"
        onClick={onToggleCam}
        className={`p-2.5 rounded-xl border transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
          camActive
            ? 'bg-slate-800/60 border-white/10 text-slate-200 hover:bg-slate-800'
            : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
        }`}
        title={camActive ? 'Turn Off Camera' : 'Turn On Camera'}
      >
        {camActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
      </button>

      <button
        type="button"
        onClick={onToggleChat}
        className={`p-2.5 rounded-xl border transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
          isChatOpen
            ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
            : 'bg-slate-800/60 border-white/10 text-slate-200 hover:bg-slate-800'
        }`}
        title={isChatOpen ? 'Close Messages' : 'Open Messages'}
      >
        <MessageSquare className="h-4 w-4" />
      </button>

      {onCancelCall && (
        <button
          type="button"
          onClick={onCancelCall}
          className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          title="Cancel Call & Exit"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">Cancel</span>
        </button>
      )}

      <div className="h-4 w-px bg-white/10 mx-1" />

      <div
        className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-2 select-none backdrop-blur-md shadow-sm"
        title="Session automatically completes once interview wrap-up is reached"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Auto-completes when finished</span>
      </div>
    </div>
  );
}
