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
  ShieldCheck,
  Send,
  Volume2,
  CheckCircle2,
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
  candidateSpeechText: string;
  realtimeInsight?: string | null;
  voiceError?: string | null;
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
  candidateSpeechText,
  realtimeInsight,
  voiceError,
  onSubmitResponse,
  onEndCall,
}: InterviewStageProps) {
  const [textInput, setTextInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll transcript to latest turn
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversationHistory, candidateSpeechText]);

  return (
    <div className="relative w-full h-[calc(100vh-6.5rem)] rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-white/50 dark:bg-slate-950/70 backdrop-blur-2xl text-slate-900 dark:text-white shadow-2xl flex flex-col justify-between p-5 sm:p-6 font-sans">
      
      {/* Background Ambient Aura */}
      <div className="absolute -top-32 left-1/4 w-96 h-96 bg-brand-500/10 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Voice / Network Error Banner */}
      {voiceError && (
        <div className="absolute top-20 left-6 right-6 z-50 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 shadow-lg backdrop-blur-md">
          <span>⚠️ {voiceError}</span>
        </div>
      )}

      {/* Top Navigation / Stage Status */}
      <div className="flex items-center justify-between z-20 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 dark:from-orange-500 dark:to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 dark:shadow-orange-500/20 flex-shrink-0">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
                AI Voice Resume Session
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {targetRole} • {experienceLevel}
            </p>
          </div>
        </div>

        {/* Live Call Duration Countdown */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 shadow-xs">
          <Clock className="h-4 w-4 text-emerald-500 dark:text-emerald-400 animate-pulse" />
          <span>{formatTimer(timeRemaining)}</span>
        </div>
      </div>

      {/* Main Grid: AI Assistant & Conversation Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-4 flex-1 min-h-0 relative z-10">
        
        {/* Left Column: AI Speaking Sphere & Active Prompts (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 p-6 flex flex-col justify-between shadow-xs">
          
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <span className={`h-2 w-2 rounded-full ${aiState === 'speaking' ? 'bg-orange-500 animate-pulse' : aiState === 'evaluating' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
              {aiState === 'speaking' ? 'AI Speaking...' : aiState === 'evaluating' ? 'Thinking...' : 'AI Listening...'}
            </div>

            <div className="flex items-center gap-1 h-4">
              {[30, 70, 45, 90, 60, 100, 40, 80].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    aiState === 'speaking' ? 'bg-orange-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-800'
                  }`}
                  style={{ height: aiState === 'speaking' ? `${h}%` : '25%' }}
                />
              ))}
            </div>
          </div>

          {/* AI Voice Glowing Orb Centerpiece */}
          <div className="relative flex items-center justify-center my-6">
            <div
              className={`absolute h-44 w-44 sm:h-52 sm:w-52 rounded-full bg-brand-500/10 dark:bg-orange-500/10 border border-brand-500/20 dark:border-orange-500/20 transition-all duration-700 ${
                aiState === 'speaking' ? 'scale-125 opacity-100 animate-pulse' : 'scale-90 opacity-20'
              }`}
            />
            <div
              className={`absolute h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 transition-all duration-500 ${
                aiState === 'speaking' ? 'scale-110' : 'scale-95'
              }`}
            />
            
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-gradient-to-tr from-brand-600 via-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/25 dark:shadow-orange-500/25">
              <Bot className={`h-12 w-12 ${aiState === 'speaking' ? 'animate-bounce' : ''}`} />
            </div>
          </div>

          {/* Active Question & Extraction Highlight */}
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-brand-600 dark:text-orange-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Interviewer Dialogue</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed font-display">
                &ldquo;{currentTurn.aiMessage}&rdquo;
              </p>
            </div>

            {realtimeInsight && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center animate-in fade-in duration-200">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-0.5">
                  ✦ Live Extraction Insight
                </span>
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 leading-relaxed">
                  {realtimeInsight}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Transcript Thread & Webcam (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 p-5 flex flex-col justify-between shadow-xs overflow-hidden">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-display">
                Live Conversation Stream
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800">
                {conversationHistory.length} turns
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <span className={`h-2 w-2 rounded-full ${micActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {micActive ? 'Mic Active' : 'Muted'}
              </div>
            </div>
          </div>

          {/* Conditional Display: Webcam Feed OR Live Chat Transcript */}
          {camActive ? (
            <div className="relative flex-1 w-full my-3 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 min-h-[240px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover transform -scale-x-100"
              />
              {candidateSpeechText && (
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-xs font-medium text-white shadow-xl">
                  &ldquo;{candidateSpeechText}&rdquo;
                </div>
              )}
            </div>
          ) : (
            <div
              ref={chatScrollRef}
              className="flex-1 w-full my-3 overflow-y-auto space-y-3.5 pr-2 max-h-[320px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
            >
              {conversationHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <User className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-500">
                    Conversation is starting... Say hello to begin!
                  </p>
                </div>
              ) : (
                conversationHistory.map((turn, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${turn.role === 'candidate' ? 'items-end' : 'items-start'} space-y-1 animate-in fade-in duration-200`}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>{turn.role === 'candidate' ? 'You' : 'AI Lead'}</span>
                      <span>•</span>
                      <span>{turn.timestamp || 'Just now'}</span>
                    </div>

                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        turn.role === 'candidate'
                          ? 'bg-brand-600 dark:bg-orange-600 text-white rounded-tr-xs font-medium shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs font-semibold shadow-xs'
                      }`}
                    >
                      {turn.content}
                    </div>
                  </div>
                ))
              )}

              {/* Real-time live spoken candidate buffer */}
              {candidateSpeechText && (
                <div className="flex flex-col items-end space-y-1 animate-in fade-in duration-100">
                  <div className="flex items-center gap-1 text-[9px] font-black text-orange-500 uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping" />
                    <span>Speaking live...</span>
                  </div>
                  <div className="max-w-[85%] p-3.5 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-xs font-medium text-orange-950 dark:text-orange-100 rounded-tr-xs shadow-xs">
                    {candidateSpeechText}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Typing fallback form */}
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
              className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={aiState === 'listening' ? "Or type your answer here..." : "Please wait for AI..."}
                disabled={aiState !== 'listening'}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:focus:border-orange-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={aiState !== 'listening' || !textInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-orange-600 dark:hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center cursor-pointer transition-all shadow-xs"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Floating Bottom Control Action Pill */}
      <div className="mx-auto z-30 px-6 py-3 rounded-full border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl flex items-center gap-4 select-none">
        
        {/* Toggle Microphone */}
        <button
          type="button"
          onClick={() => setMicActive(!micActive)}
          className={`p-3 rounded-full border transition-all cursor-pointer ${
            micActive
              ? 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400'
          }`}
          title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        {/* Toggle Camera */}
        <button
          type="button"
          onClick={() => setCamActive(!camActive)}
          className={`p-3 rounded-full border transition-all cursor-pointer ${
            camActive
              ? 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400'
          }`}
          title={camActive ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {camActive ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Complete & Build Resume */}
        <button
          type="button"
          onClick={onEndCall}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-brand-600 to-amber-600 dark:from-orange-600 dark:to-amber-600 hover:scale-[1.01] text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <PhoneOff className="h-4 w-4" />
          <span>Finish &amp; Build Resume</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}
