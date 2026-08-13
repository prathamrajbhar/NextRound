'use client';

import React from 'react';
import { MessageSquare, X } from '@/lib/lucide-google-icons';
import { Message } from './types';

interface ConsoleTranscriptDrawerProps {
  messages: Message[];
  onClose: () => void;
  transcriptEndRef: React.RefObject<HTMLDivElement | null>;
}




export function ConsoleTranscriptDrawer({ messages, onClose, transcriptEndRef }: ConsoleTranscriptDrawerProps) {
  return (
    <div className="absolute right-4 top-20 bottom-24 w-80 sm:w-96 bg-slate-900/95 border border-slate-800 rounded-3xl p-4 shadow-2xl backdrop-blur-xl z-40 flex flex-col space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <span className="text-xs font-extrabold text-white font-display flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand-400" />
          Live Transcript &amp; Dialogue
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 py-8 font-medium">No transcript turns logged yet.</div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                m.role === 'candidate'
                  ? 'bg-brand-950/40 border-brand-800/50 text-brand-200 text-right ml-6'
                  : 'bg-slate-950 border-slate-800 text-slate-200 mr-6'
              }`}
            >
              <span className="text-[10px] font-extrabold block text-slate-400 uppercase tracking-wider mb-1">
                {m.role === 'candidate' ? 'Candidate' : 'AI Interviewer'}
              </span>
              {m.content}
            </div>
          ))
        )}
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
}
