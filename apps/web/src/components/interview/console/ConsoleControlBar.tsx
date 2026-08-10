'use client';

import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send } from '@/lib/lucide-google-icons';

interface ConsoleControlBarProps {
  micActive: boolean;
  camActive: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  showTextFallback: boolean;
  textInput: string;
  onTextInputChange: (text: string) => void;
  onTextSubmit: (e: React.FormEvent) => void;
  isAnalyzing: boolean;
  onEndSession: () => void;
}

/**
 * Floating bottom control bar: mic/cam toggles, the text fallback input, and
 * the end-session button.
 */
export function ConsoleControlBar({
  micActive,
  camActive,
  onToggleMic,
  onToggleCam,
  showTextFallback,
  textInput,
  onTextInputChange,
  onTextSubmit,
  isAnalyzing,
  onEndSession,
}: ConsoleControlBarProps) {
  return (
    <footer className="h-20 border-t border-slate-800/80 bg-slate-950 px-4 sm:px-8 flex items-center justify-between z-30 flex-shrink-0 shadow-2xl">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMic}
          className={`p-3.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            micActive ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800' : 'bg-rose-950 border-rose-800 text-rose-300'
          }`}
        >
          {micActive ? <Mic className="h-4 w-4 text-emerald-400" /> : <MicOff className="h-4 w-4 text-rose-400" />}
        </button>

        <button
          type="button"
          onClick={onToggleCam}
          className={`p-3.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            camActive ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800' : 'bg-rose-950 border-rose-800 text-rose-300'
          }`}
        >
          {camActive ? <Video className="h-4 w-4 text-emerald-400" /> : <VideoOff className="h-4 w-4 text-rose-400" />}
        </button>
      </div>

      {/* Text Fallback Form */}
      {showTextFallback && (
        <form onSubmit={onTextSubmit} className="hidden sm:flex flex-1 max-w-lg mx-4 items-center gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => onTextInputChange(e.target.value)}
            placeholder="Type your response as text fallback..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isAnalyzing}
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={onEndSession}
        className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
      >
        <PhoneOff className="h-4 w-4" />
        <span>End Session</span>
      </button>
    </footer>
  );
}
