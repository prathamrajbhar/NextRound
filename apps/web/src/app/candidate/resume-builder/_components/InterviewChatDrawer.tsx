'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, User, Send } from '@/lib/lucide-google-icons';

interface ConversationTurn {
  role: 'candidate' | 'ai';
  content: string;
  timestamp: string;
}

interface InterviewChatDrawerProps {
  conversationHistory: ConversationTurn[];
  aiState: 'speaking' | 'listening' | 'evaluating';
  candidateSpeechText: string;
  onClose: () => void;
  onSubmitResponse?: (text: string) => void;
}

export function InterviewChatDrawer({
  conversationHistory,
  aiState,
  candidateSpeechText,
  onClose,
  onSubmitResponse,
}: InterviewChatDrawerProps) {
  const [textInput, setTextInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversationHistory, candidateSpeechText]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = textInput.trim();
    if (val && onSubmitResponse) {
      onSubmitResponse(val);
      setTextInput('');
    }
  };

  return (
    <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-orange-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wide">
            Chat &amp; History
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-300 bg-slate-950 border border-white/10">
            {conversationHistory.length} turns
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={chatScrollRef}
        className="flex-1 w-full overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800"
        style={{ maxHeight: 'calc(100vh - 22rem)' }}
      >
        {conversationHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
            <User className="h-6 w-6 text-slate-500" />
            <p className="text-[11px] font-medium">No transcript history yet. Begin speaking!</p>
          </div>
        ) : (
          conversationHistory.map((turn, index) => (
            <div
              key={index}
              className={`flex flex-col ${turn.role === 'candidate' ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                <span>{turn.role === 'candidate' ? 'You' : 'AI Lead'}</span>
                <span>•</span>
                <span>{turn.timestamp || 'Just now'}</span>
              </div>

              <div
                className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  turn.role === 'candidate'
                    ? 'bg-orange-600 text-white font-medium rounded-tr-xs'
                    : 'bg-slate-950 border border-white/10 text-slate-200 font-medium rounded-tl-xs'
                }`}
              >
                {turn.content}
              </div>
            </div>
          ))
        )}
      </div>

      {onSubmitResponse && (
        <form
          onSubmit={handleFormSubmit}
          className="relative flex items-center gap-2 pt-3 border-t border-white/10 mt-3"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={aiState === 'listening' ? 'Type your response...' : 'Please wait for AI...'}
            disabled={aiState !== 'listening'}
            className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-white/10 text-xs rounded-xl focus:outline-none focus:border-orange-500 text-white placeholder-slate-500 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={aiState !== 'listening' || !textInput.trim()}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-orange-400 disabled:opacity-30 cursor-pointer active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
