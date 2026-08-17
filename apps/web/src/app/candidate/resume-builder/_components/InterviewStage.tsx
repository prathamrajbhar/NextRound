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
}: InterviewStageProps) {
  const [textInput, setTextInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversationHistory, candidateSpeechText]);

  const soundScale = micActive ? 1 + (micLevel / 100) * 0.4 : 1;

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white shadow-2xl flex flex-col justify-between p-6 sm:p-8 font-sans">
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-tr from-orange-600/10 to-amber-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-amber-600/10 to-orange-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

      {/* Voice Error Banner */}
      {voiceError && (
        <div className="absolute top-24 left-8 right-8 z-50 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2.5 text-xs font-bold text-rose-500 dark:text-rose-450 shadow-[0_8px_32px_rgba(244,63,94,0.2)] backdrop-blur-xl animate-in slide-in-from-top duration-300">
          <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          <span>⚠️ {voiceError}</span>
        </div>
      )}

      {/* Glass Header */}
      <div className="flex items-center justify-between z-20 border-b border-slate-200/80 dark:border-white/5 pb-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(249,115,22,0.35)] flex-shrink-0 ring-2 ring-white/10">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-black tracking-tight font-display bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                AI Resume Builder Call
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-250 dark:border-emerald-800/40 flex items-center gap-1.5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" /> Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wide mt-0.5 uppercase">
              {targetRole} • {experienceLevel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 font-mono text-sm font-black text-slate-700 dark:text-slate-200 shadow-md backdrop-blur-md">
          <Clock className="h-4 w-4 text-orange-500 dark:text-orange-450 animate-pulse" />
          <span>{formatTimer(timeRemaining)}</span>
        </div>
      </div>

      {/* Main Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-5 flex-1 min-h-0 relative z-10">
        
        {/* Left Interviewer Box */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 dark:border-white/5 bg-white/40 dark:bg-slate-900/20 backdrop-blur-xl p-6 flex flex-col justify-between shadow-xl ring-1 ring-black/5 dark:ring-white/5">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-950/80 border border-slate-250 dark:border-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 shadow-sm">
              <span className={`h-1.5 w-1.5 rounded-full ${aiState === 'speaking' ? 'bg-orange-500 animate-pulse ring-2 ring-orange-500/35' : aiState === 'evaluating' ? 'bg-amber-500 animate-pulse ring-2 ring-amber-500/35' : 'bg-emerald-500 animate-pulse ring-2 ring-emerald-500/35'}`} />
              {aiState === 'speaking' ? 'AI Lead Speaking' : aiState === 'evaluating' ? 'AI Reviewing Response' : 'Listening to Candidate'}
            </div>

            <div className="flex items-center gap-1.5 h-5 px-2 bg-slate-100/50 dark:bg-slate-950/40 rounded-full border border-slate-200/50 dark:border-white/5">
              {[45, 80, 55, 95, 65, 85, 40, 70].map((h, i) => (
                <div
                  key={i}
                  className={`w-0.75 rounded-full transition-all duration-150 ${
                    aiState === 'speaking'
                      ? 'bg-gradient-to-t from-orange-500 to-amber-400 animate-pulse'
                      : micActive && micLevel > 10
                      ? 'bg-gradient-to-t from-emerald-500 to-teal-400 animate-pulse'
                      : 'bg-slate-300 dark:bg-slate-800'
                  }`}
                  style={{
                    height:
                      aiState === 'speaking'
                        ? `${h}%`
                        : micActive
                        ? `${(h * micLevel) / 100}%`
                        : '25%',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center my-6 relative">
            {camActive ? (
              <div className="relative w-full h-full max-h-[290px] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 shadow-2xl ring-1 ring-orange-500/20">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover transform -scale-x-100"
                />

                {micActive && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-wider text-emerald-400 shadow-lg">
                    <Mic className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                    <span>Mic Live</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative flex flex-col items-center justify-center py-6">
                <div
                  className="absolute h-48 w-48 sm:h-60 sm:w-60 rounded-full bg-gradient-to-tr from-orange-500/10 to-amber-500/5 border border-orange-500/10 transition-transform duration-100 ease-out animate-pulse"
                  style={{ transform: `scale(${soundScale * 1.25})` }}
                />
                <div
                  className="absolute h-36 w-36 sm:h-48 sm:w-48 rounded-full bg-gradient-to-tr from-amber-500/10 to-yellow-500/5 border border-amber-550/10 transition-transform duration-100 ease-out"
                  style={{ transform: `scale(${soundScale * 1.12})` }}
                />
                <div
                  className="absolute h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-orange-550/5 border border-orange-500/10 transition-transform duration-100 ease-out"
                  style={{ transform: `scale(${soundScale})` }}
                />

                <div
                  className={`relative h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 flex items-center justify-center text-white shadow-[0_0_40px_rgba(249,115,22,0.35)] transition-all duration-300 border-2 border-white/10 ${
                    aiState === 'speaking' ? 'scale-105 shadow-[0_0_50px_rgba(249,115,22,0.55)] border-orange-400' : ''
                  }`}
                >
                  <Bot className="h-10 w-10 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.2)]" />
                </div>

                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-6 block">
                  {aiState === 'speaking' ? 'AI Lead Speaking' : 'Listening...'}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Interviewer Speech Bubble */}
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-950/65 border border-slate-200/80 dark:border-white/5 shadow-lg space-y-2.5 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-405">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Interviewer Dialogue</span>
                </div>
                {onReplayAudio && (
                  <button
                    type="button"
                    onClick={onReplayAudio}
                    className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition-all cursor-pointer px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-white/5 active:scale-95 shadow-sm"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Play Audio</span>
                  </button>
                )}
              </div>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-relaxed font-display pr-2">
                &ldquo;{currentTurn.aiMessage}&rdquo;
              </p>
            </div>

            {/* Extra AI Insights Box */}
            {realtimeInsight && (
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center animate-in fade-in duration-300 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 pointer-events-none" />
                <span className="text-[9px] font-black uppercase tracking-wider text-orange-600 dark:text-amber-400 block">
                  ✦ Resume builder extraction advice
                </span>
                <p className="text-[10.5px] font-bold text-orange-850 dark:text-amber-300 leading-relaxed mt-1.5">
                  {realtimeInsight}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Conversation History Box */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 dark:border-white/5 bg-white/40 dark:bg-slate-900/20 backdrop-blur-xl p-5 flex flex-col justify-between shadow-xl ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3 mb-4">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-display uppercase tracking-wider">
              Conversation History
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black text-slate-650 dark:text-slate-400 bg-white dark:bg-slate-950 border border-slate-250 dark:border-white/5 shadow-sm">
              {conversationHistory.length} turns
            </span>
          </div>

          {/* Conversation Bubbles */}
          <div
            ref={chatScrollRef}
            className="flex-1 w-full overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
            style={{ maxHeight: 'calc(100vh - 23rem)' }}
          >
            {conversationHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400 dark:text-slate-500">
                <div className="h-11 w-11 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-md">
                  <User className="h-5.5 w-5.5" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Connection established. Speak to begin!
                </p>
              </div>
            ) : (
              conversationHistory.map((turn, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${turn.role === 'candidate' ? 'items-end' : 'items-start'} space-y-1.5 animate-in fade-in duration-200`}
                >
                  <div className="flex items-center gap-1.5 text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                    <span>{turn.role === 'candidate' ? 'You' : 'AI Lead'}</span>
                    <span>•</span>
                    <span>{turn.timestamp || 'Just now'}</span>
                  </div>

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-[11.5px] leading-relaxed shadow-md ${
                      turn.role === 'candidate'
                        ? 'bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-tr-xs font-semibold'
                        : 'bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-100 rounded-tl-xs font-semibold'
                    }`}
                  >
                    {turn.content}
                  </div>
                </div>
              ))
            )}

            {/* Speaking Live Transcript Indicator */}
            {candidateSpeechText && (
              <div className="flex flex-col items-end space-y-1.5 animate-in fade-in duration-100">
                <div className="flex items-center gap-1.5 text-[8.5px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider px-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-600 dark:bg-orange-400 animate-ping" />
                  <span>Speaking...</span>
                </div>
                <div className="max-w-[85%] p-3.5 rounded-2xl bg-orange-500/5 border border-orange-500/20 text-[11.5px] font-semibold text-orange-850 dark:text-orange-100 rounded-tr-xs shadow-inner">
                  {candidateSpeechText}
                </div>
              </div>
            )}
          </div>

          {/* Inline Chat Input */}
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
              className="relative flex items-center gap-2.5 pt-4 border-t border-slate-200 dark:border-white/5 mt-4 animate-in slide-in-from-bottom duration-300"
            >
              <div className="relative flex-1 flex items-center">
                <button
                  type="button"
                  onClick={() => setMicActive(!micActive)}
                  className={`absolute left-3.5 p-1.5 rounded-xl transition-all cursor-pointer z-20 ${
                    micActive
                      ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-450 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 shadow-md scale-105'
                      : 'text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                  }`}
                  title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>

                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={aiState === 'listening' ? "Type your response..." : "Please wait for AI..."}
                  disabled={aiState !== 'listening'}
                  className="w-full pl-12 pr-11 py-3 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-xs rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50 shadow-sm"
                />

                <button
                  type="submit"
                  disabled={aiState !== 'listening' || !textInput.trim()}
                  className="absolute right-2 p-1.5 rounded-lg text-slate-400 hover:text-orange-500 disabled:opacity-20 disabled:hover:text-slate-400 transition-all cursor-pointer active:scale-90"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>

      </div>

      {/* Floating Control Island */}
      <div className="mx-auto z-30 px-6 py-3 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl flex items-center gap-4 select-none relative ring-1 ring-black/5 dark:ring-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-full pointer-events-none" />
        
        <button
          type="button"
          onClick={() => setMicActive(!micActive)}
          className={`p-2.5 rounded-full border transition-all cursor-pointer shadow-sm active:scale-95 ${
            micActive
              ? 'bg-white border-slate-200 dark:bg-slate-800 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400 animate-pulse'
          }`}
          title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micActive ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
        </button>

        <button
          type="button"
          onClick={() => setCamActive(!camActive)}
          className={`p-2.5 rounded-full border transition-all cursor-pointer shadow-sm active:scale-95 ${
            camActive
              ? 'bg-white border-slate-200 dark:bg-slate-800 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-455'
          }`}
          title={camActive ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {camActive ? <Video className="h-4.5 w-4.5" /> : <VideoOff className="h-4.5 w-4.5" />}
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1" />

        <button
          type="button"
          onClick={onEndCall}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:scale-[1.02] text-white text-[11px] font-black uppercase tracking-wider shadow-[0_4px_15px_rgba(249,115,22,0.3)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
        >
          <PhoneOff className="h-3.5 w-3.5" />
          <span>Finish &amp; Build Resume</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
