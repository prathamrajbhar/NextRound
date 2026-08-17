'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Clock,
  User,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Sparkles,
  ArrowRight,
  Send,
  Volume2,
  MessageSquare,
  X,
  ArrowLeft,
} from '@/lib/lucide-google-icons';

interface ConversationTurn {
  role: 'candidate' | 'ai';
  content: string;
  timestamp: string;
}

interface InterviewStageProps {
  targetRole: string;
  experienceLevel: string;
  timeRemaining: number;
  formatTimer: (sec: number) => string;
  aiState: 'speaking' | 'listening' | 'evaluating';
  currentTurn: { aiMessage: string };
  conversationHistory?: ConversationTurn[];
  videoRef: React.RefObject<HTMLVideoElement | null>;
  camActive: boolean;
  setCamActive: (val: boolean) => void;
  micActive: boolean;
  setMicActive: (val: boolean) => void;
  micLevel?: number;
  candidateSpeechText: string;
  realtimeInsight?: string | null;
  voiceError?: string | null;
  onReplayAudio?: () => void;
  onSubmitResponse?: (text: string) => void;
  onEndCall: () => void;
  onCancelCall?: () => void;
}

export function InterviewStage({
  targetRole,
  experienceLevel,
  timeRemaining,
  formatTimer,
  aiState,
  currentTurn,
  conversationHistory = [],
  videoRef,
  camActive,
  setCamActive,
  micActive,
  setMicActive,
  micLevel = 0,
  candidateSpeechText,
  realtimeInsight,
  voiceError,
  onReplayAudio,
  onSubmitResponse,
  onEndCall,
  onCancelCall,
}: InterviewStageProps) {
  const [textInput, setTextInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current && isChatOpen) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversationHistory, candidateSpeechText, isChatOpen]);

  // Extract the latest turn spoken by candidate
  const lastCandidateTurn = [...conversationHistory].reverse().find((t) => t.role === 'candidate');

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] rounded-3xl border border-white/10 bg-slate-950/90 text-slate-100 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col justify-between p-6 font-sans">
      
      {/* Voice Error Banner */}
      {voiceError && (
        <div className="absolute top-16 left-6 right-6 z-50 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2.5 text-xs font-semibold text-rose-400 backdrop-blur-xl shadow-lg">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          <span>⚠️ {voiceError}</span>
        </div>
      )}

      {/* Top Header */}
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
            onClick={() => setIsChatOpen(!isChatOpen)}
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

      {/* Main Grid: AI (Left) | User (Right) | [Optional Chat Drawer] */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-4 flex-1 min-h-0">
        
        {/* LEFT PANEL: AI Voice Lead & AI Talk */}
        <div className={`${isChatOpen ? 'lg:col-span-4' : 'lg:col-span-6'} rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-5 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300`}>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur-md">
              <span className={`h-1.5 w-1.5 rounded-full ${aiState === 'speaking' ? 'bg-orange-400 animate-pulse' : aiState === 'evaluating' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
              {aiState === 'speaking' ? 'AI Lead Speaking' : aiState === 'evaluating' ? 'AI Reviewing Response' : 'AI Listening'}
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

          {/* AI Avatar Display */}
          <div className="flex-1 flex flex-col items-center justify-center my-4 relative min-h-[220px]">
            <div
              className={`h-24 w-24 rounded-3xl bg-slate-950/90 border border-white/10 backdrop-blur-md flex items-center justify-center text-orange-400 shadow-xl transition-all ${
                aiState === 'speaking' ? 'border-orange-500/50 bg-orange-500/10 scale-105 shadow-orange-500/20' : ''
              }`}
            >
              <Bot className="h-11 w-11" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mt-4 block">
              AI Interviewer Lead
            </span>
          </div>

          {/* AI Dialogue Box */}
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
                <p className="text-[11px] font-medium text-amber-200 mt-0.5">
                  {realtimeInsight}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT PANEL: User/Candidate Face & User Speech */}
        <div className={`${isChatOpen ? 'lg:col-span-4' : 'lg:col-span-6'} rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-5 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300`}>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur-md">
              <span className={`h-1.5 w-1.5 rounded-full ${micActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              Candidate Camera Feed
            </div>

            {micActive && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                <Mic className="h-3 w-3 animate-pulse" />
                <span>Mic Live</span>
              </div>
            )}
          </div>

          {/* User Video Feed */}
          <div className="flex-1 flex items-center justify-center my-3 relative min-h-[220px]">
            {camActive ? (
              <div className="relative w-full h-full overflow-hidden rounded-2xl bg-slate-950/90 border border-white/10 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover transform -scale-x-100"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="h-20 w-20 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-md flex items-center justify-center text-slate-400 shadow-md">
                  <User className="h-9 w-9" />
                </div>
                <span className="text-[11px] font-medium text-slate-400 mt-4 block">
                  Camera Off
                </span>
              </div>
            )}
          </div>

          {/* Candidate Speech Display */}
          <div className="p-4 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 space-y-2 relative shadow-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Mic className="h-3 w-3" /> Candidate Spoken Response
            </span>

            {candidateSpeechText ? (
              <p className="text-xs font-semibold text-emerald-300 leading-relaxed animate-in fade-in duration-100">
                &ldquo;{candidateSpeechText}&rdquo;
              </p>
            ) : lastCandidateTurn ? (
              <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                &ldquo;{lastCandidateTurn.content}&rdquo;
              </p>
            ) : (
              <p className="text-xs font-medium text-slate-500 italic">
                Speak into your microphone or click the Messages button to type...
              </p>
            )}
          </div>

        </div>

        {/* SIDE DRAWER: Full Conversation History & Text Chat (Open when isChatOpen is true) */}
        {isChatOpen && (
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
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Conversation Turns */}
            <div
              ref={chatScrollRef}
              className="flex-1 w-full overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800"
              style={{ maxHeight: 'calc(100vh - 22rem)' }}
            >
              {conversationHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
                  <User className="h-6 w-6 text-slate-500" />
                  <p className="text-[11px] font-medium">
                    No transcript history yet. Begin speaking!
                  </p>
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

            {/* Inline Text Input Form */}
            {onSubmitResponse && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = textInput.trim();
                  if (val) {
                    onSubmitResponse(val);
                    setTextInput('');
                  }
                }}
                className="relative flex items-center gap-2 pt-3 border-t border-white/10 mt-3"
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={aiState === 'listening' ? "Type your response..." : "Please wait for AI..."}
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
        )}

      </div>

      {/* Floating Bottom Control Bar */}
      <div className="mx-auto px-5 py-2.5 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center gap-3 select-none shadow-2xl">
        <button
          type="button"
          onClick={() => setMicActive(!micActive)}
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
          onClick={() => setCamActive(!camActive)}
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
          onClick={() => setIsChatOpen(!isChatOpen)}
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

    </div>
  );
}
