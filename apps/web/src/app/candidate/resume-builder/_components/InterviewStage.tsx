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
  currentTurn: { aiMessage: string; simulatedUserAnswer: string };
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

  
  const soundScale = micActive ? 1 + (micLevel / 100) * 0.5 : 1;

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800/40 bg-white dark:bg-slate-950 text-slate-800 dark:text-white shadow-xl dark:shadow-2xl flex flex-col justify-between p-6 sm:p-8 font-sans">
      
      {}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/5 dark:bg-orange-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-600/5 dark:bg-amber-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

      {}
      {voiceError && (
        <div className="absolute top-20 left-8 right-8 z-50 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-bold text-rose-500 dark:text-rose-400 shadow-[0_8px_32px_rgba(244,63,94,0.15)] backdrop-blur-lg">
          <span>⚠️ {voiceError}</span>
        </div>
      )}

      {}
      <div className="flex items-center justify-between z-20 border-b border-slate-100 dark:border-white/5 pb-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] flex-shrink-0">
            <Bot className="h-6.5 w-6.5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-extrabold tracking-tight font-display bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                AI Resume Builder Call
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-550 dark:bg-emerald-400 animate-ping" /> Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {targetRole} • {experienceLevel}
            </p>
          </div>
        </div>

        {}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 font-mono text-sm font-black text-slate-700 dark:text-slate-200 shadow-md">
          <Clock className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          <span>{formatTimer(timeRemaining)}</span>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-5 flex-1 min-h-0 relative z-10">
        
        {}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-900/30 backdrop-blur-md p-6 flex flex-col justify-between shadow-inner">
          
          {}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${aiState === 'speaking' ? 'bg-orange-500 animate-pulse' : aiState === 'evaluating' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
              {aiState === 'speaking' ? 'AI Lead Speaking' : aiState === 'evaluating' ? 'AI Reviewing Response' : 'Listening to Candidate'}
            </div>

            {}
            <div className="flex items-center gap-1 h-4">
              {[40, 75, 55, 90, 60, 95, 45, 80].map((h, i) => (
                <div
                  key={i}
                  className={`w-0.5 rounded-full transition-all duration-150 ${
                    aiState === 'speaking'
                      ? 'bg-orange-500 animate-pulse'
                      : micActive && micLevel > 10
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-slate-300 dark:bg-slate-800'
                  }`}
                  style={{
                    height:
                      aiState === 'speaking'
                        ? `${h}%`
                        : micActive
                        ? `${(h * micLevel) / 100}%`
                        : '20%',
                  }}
                />
              ))}
            </div>
          </div>

          {}
          <div className="flex-1 flex items-center justify-center my-6 relative">
            {camActive ? (
              <div className="relative w-full h-full max-h-[280px] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/5 shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover transform -scale-x-100"
                />
                
                {micActive && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-black text-emerald-600 dark:text-emerald-400 shadow-md">
                    <Mic className="h-3.5 w-3.5 animate-pulse" />
                    <span>Mic Live</span>
                  </div>
                )}
              </div>
            ) : (
              
              <div className="relative flex flex-col items-center justify-center">
                <div
                  className="absolute h-44 w-44 sm:h-56 sm:w-56 rounded-full bg-orange-500/5 border border-orange-500/10 transition-transform duration-100 ease-out"
                  style={{ transform: `scale(${soundScale * 1.3})` }}
                />
                <div
                  className="absolute h-32 w-32 sm:h-44 sm:w-44 rounded-full bg-amber-500/10 border border-amber-500/15 transition-transform duration-100 ease-out"
                  style={{ transform: `scale(${soundScale * 1.15})` }}
                />
                <div
                  className="absolute h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-yellow-500/10 border border-yellow-500/20 transition-transform duration-100 ease-out"
                  style={{ transform: `scale(${soundScale})` }}
                />

                <div
                  className={`relative h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all duration-300 ${
                    aiState === 'speaking' ? 'scale-105 shadow-[0_0_40px_rgba(249,115,22,0.6)]' : ''
                  }`}
                >
                  <Bot className="h-10 w-10" />
                </div>

                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-5">
                  {aiState === 'speaking' ? 'AI Lead Speaking' : 'Listening...'}
                </span>
              </div>
            )}
          </div>

          {}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Interviewer Dialogue</span>
                </div>
                {onReplayAudio && (
                  <button
                    type="button"
                    onClick={onReplayAudio}
                    className="flex items-center gap-1 text-[9px] font-extrabold text-slate-600 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition-colors cursor-pointer px-2.5 py-1 rounded-lg bg-slate-200/50 dark:bg-slate-900 border border-slate-300 dark:border-white/5"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Play Audio</span>
                  </button>
                )}
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed font-display">
                &ldquo;{currentTurn.aiMessage}&rdquo;
              </p>
            </div>

            {realtimeInsight && (
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-550/20 text-center animate-in fade-in duration-200">
                <span className="text-[9px] font-black uppercase tracking-wider text-orange-600 dark:text-amber-400 block">
                  ✦ Resume builder extraction advice
                </span>
                <p className="text-[10.5px] font-bold text-orange-700 dark:text-amber-300/90 leading-relaxed mt-1">
                  {realtimeInsight}
                </p>
              </div>
            )}
          </div>

        </div>

        {}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-900/30 backdrop-blur-md p-4 flex flex-col justify-between shadow-inner overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2 mb-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-300 font-display">
              Conversation History
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold text-slate-650 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5">
              {conversationHistory.length} turns
            </span>
          </div>

          {}
          <div
            ref={chatScrollRef}
            className="flex-1 w-full overflow-y-auto space-y-4 pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
            style={{ maxHeight: 'calc(100vh - 22.5rem)' }}
          >
            {conversationHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400 dark:text-slate-500">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-md">
                  <User className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-bold">
                  Connection established. Speak to begin!
                </p>
              </div>
            ) : (
              conversationHistory.map((turn, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${turn.role === 'candidate' ? 'items-end' : 'items-start'} space-y-1 animate-in fade-in duration-200`}
                >
                  <div className="flex items-center gap-1.5 text-[8.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <span>{turn.role === 'candidate' ? 'You' : 'AI Lead'}</span>
                    <span>•</span>
                    <span>{turn.timestamp || 'Just now'}</span>
                  </div>

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-[11.5px] leading-relaxed shadow-lg ${
                      turn.role === 'candidate'
                        ? 'bg-orange-600 text-white rounded-tr-xs font-semibold'
                        : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-xs font-semibold dark:bg-slate-950/70 dark:border-white/5 dark:text-slate-100'
                    }`}
                  >
                    {turn.content}
                  </div>
                </div>
              ))
            )}

            {}
            {candidateSpeechText && (
              <div className="flex flex-col items-end space-y-1 animate-in fade-in duration-100">
                <div className="flex items-center gap-1 text-[8.5px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                  <span className="h-1 w-1 rounded-full bg-orange-600 dark:bg-orange-400 animate-ping" />
                  <span>Speaking...</span>
                </div>
                <div className="max-w-[85%] p-3.5 rounded-2xl bg-orange-500/5 border border-orange-550/20 text-[11.5px] font-semibold text-orange-800 dark:text-orange-100 rounded-tr-xs shadow-md">
                  {candidateSpeechText}
                </div>
              </div>
            )}
          </div>

          {}
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
              className="relative flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-white/5 mt-3 animate-in slide-in-from-bottom duration-300"
            >
              <div className="relative flex-1 flex items-center">
                {}
                <button
                  type="button"
                  onClick={() => setMicActive(!micActive)}
                  className={`absolute left-3 p-1.5 rounded-lg transition-all cursor-pointer z-20 ${
                    micActive
                      ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.15)] dark:bg-emerald-950/30'
                      : 'text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                  }`}
                  title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micActive ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
                </button>

                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={aiState === 'listening' ? "Type your response..." : "Please wait for AI..."}
                  disabled={aiState !== 'listening'}
                  className="w-full pl-11 pr-10 py-3 bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-white/5 text-xs rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-40 shadow-inner"
                />

                {}
                <button
                  type="submit"
                  disabled={aiState !== 'listening' || !textInput.trim()}
                  className="absolute right-2 p-1.5 rounded-lg text-slate-455 hover:text-orange-500 disabled:opacity-20 disabled:hover:text-slate-455 transition-all cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>

      </div>

      {}
      <div className="mx-auto z-30 px-6 py-2.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl flex items-center gap-4 select-none">
        
        {}
        <button
          type="button"
          onClick={() => setMicActive(!micActive)}
          className={`p-2.5 rounded-full border transition-all cursor-pointer ${
            micActive
              ? 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse'
          }`}
          title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micActive ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
        </button>

        {}
        <button
          type="button"
          onClick={() => setCamActive(!camActive)}
          className={`p-2.5 rounded-full border transition-all cursor-pointer ${
            camActive
              ? 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
          title={camActive ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {camActive ? <Video className="h-4.5 w-4.5" /> : <VideoOff className="h-4.5 w-4.5" />}
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1" />

        {}
        <button
          type="button"
          onClick={onEndCall}
          className="px-6 py-2 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:scale-[1.02] text-white text-[11px] font-black shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all cursor-pointer flex items-center gap-1.5"
        >
          <PhoneOff className="h-3.5 w-3.5" />
          <span>Finish &amp; Build Resume</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  );
}
