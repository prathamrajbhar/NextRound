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

  // Auto scroll transcript to latest turn
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversationHistory, candidateSpeechText]);

  // Calculate dynamic scale for user voice visualization
  const soundScale = micActive ? 1 + (micLevel / 100) * 0.4 : 1;

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

      {/* Top Header / Stage Status */}
      <div className="flex items-center justify-between z-20 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 dark:from-orange-500 dark:to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 dark:shadow-orange-500/20 flex-shrink-0">
            <Bot className="h-5.5 w-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold tracking-tight font-display">
                AI Resume Builder Call
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Live
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {targetRole} • {experienceLevel}
            </p>
          </div>
        </div>

        {/* Live Call Duration Countdown */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 font-mono text-xs font-black text-slate-800 dark:text-slate-200 shadow-xs">
          <Clock className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
          <span>{formatTimer(timeRemaining)}</span>
        </div>
      </div>

      {/* Main Content Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-4 flex-1 min-h-0 relative z-10">
        
        {/* Left Section: Active Call Viewport (Avatar Orb or Web Camera) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-white/70 dark:bg-slate-900/50 p-5 flex flex-col justify-between shadow-xs overflow-hidden">
          
          {/* Active Call Status Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${aiState === 'speaking' ? 'bg-orange-500 animate-pulse' : aiState === 'evaluating' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
              {aiState === 'speaking' ? 'AI Assistant Speaking' : aiState === 'evaluating' ? 'AI Reviewing Response' : 'Listening to Candidate'}
            </div>

            {/* Custom Mini Equalizer Graphic */}
            <div className="flex items-center gap-1 h-3.5">
              {[40, 75, 55, 90, 60, 95, 45, 80].map((h, i) => (
                <div
                  key={i}
                  className={`w-0.5 rounded-full transition-all duration-150 ${
                    aiState === 'speaking'
                      ? 'bg-orange-500 animate-pulse'
                      : micActive && micLevel > 15
                      ? 'bg-emerald-500'
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

          {/* Interactive Screen Viewport */}
          <div className="flex-1 flex items-center justify-center my-4 relative">
            {camActive ? (
              /* Premium Camera Viewport */
              <div className="relative w-full h-full max-h-[300px] overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover transform -scale-x-100"
                />
                
                {/* Audio Wave overlay inside camera feed */}
                {micActive && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[10px] font-black text-emerald-400">
                    <Mic className="h-3.5 w-3.5 animate-pulse" />
                    <span>User Audio active</span>
                  </div>
                )}
              </div>
            ) : (
              /* Siri/Gemini Live style Pulsing Audio Sphere */
              <div className="relative flex flex-col items-center justify-center">
                
                {/* Background glow waves */}
                <div
                  className="absolute h-40 w-40 sm:h-48 sm:w-48 rounded-full bg-brand-500/10 dark:bg-orange-500/10 border border-brand-500/20 dark:border-orange-500/20 transition-transform duration-100 ease-out"
                  style={{ transform: `scale(${soundScale * 1.25})` }}
                />
                <div
                  className="absolute h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 transition-transform duration-100 ease-out"
                  style={{ transform: `scale(${soundScale * 1.1})` }}
                />

                {/* Core animated orb */}
                <div
                  className={`relative h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-tr from-brand-600 via-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/25 dark:shadow-orange-500/25 transition-all duration-300 ${
                    aiState === 'speaking' ? 'animate-pulse scale-105' : ''
                  }`}
                >
                  <Bot className="h-9 w-9" />
                </div>

                {/* Subtitle status label */}
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-4">
                  {aiState === 'speaking' ? 'Assistant Speaking' : 'Listening...'}
                </span>
              </div>
            )}
          </div>

          {/* Active dialogue transcript box */}
          <div className="space-y-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-brand-600 dark:text-orange-400">
                  <Sparkles className="h-3 w-3" />
                  <span>Interviewer Dialogue</span>
                </div>
                {onReplayAudio && (
                  <button
                    type="button"
                    onClick={onReplayAudio}
                    className="flex items-center gap-1 text-[9px] font-extrabold text-slate-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400 transition-colors cursor-pointer px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800"
                    title="Replay Voice"
                  >
                    <Volume2 className="h-3 w-3" />
                    <span>Play Audio</span>
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-relaxed font-display">
                &ldquo;{currentTurn.aiMessage}&rdquo;
              </p>
            </div>

            {realtimeInsight && (
              <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center animate-in fade-in duration-200">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  ✦ Resume builder extraction advice
                </span>
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 leading-relaxed mt-0.5">
                  {realtimeInsight}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Section: Compact Dialogue Stream & Typing Fallback Input (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-white/70 dark:bg-slate-900/50 p-4 flex flex-col justify-between shadow-xs overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-2 mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-display">
              Conversation History
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-850">
              {conversationHistory.length} turns
            </span>
          </div>

          {/* Messages list */}
          <div
            ref={chatScrollRef}
            className="flex-1 w-full overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-850"
            style={{ maxHeight: 'calc(100vh - 21.5rem)' }}
          >
            {conversationHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-1.5 text-slate-400">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-bold text-slate-500">
                  Conversation started. Speak to begin!
                </p>
              </div>
            ) : (
              conversationHistory.map((turn, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${turn.role === 'candidate' ? 'items-end' : 'items-start'} space-y-0.5 animate-in fade-in duration-200`}
                >
                  <div className="flex items-center gap-1 text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <span>{turn.role === 'candidate' ? 'You' : 'AI Lead'}</span>
                    <span>•</span>
                    <span>{turn.timestamp || 'Just now'}</span>
                  </div>

                  <div
                    className={`max-w-[90%] p-3 rounded-2xl text-[11px] leading-relaxed ${
                      turn.role === 'candidate'
                        ? 'bg-brand-600 dark:bg-orange-600 text-white rounded-tr-xs font-semibold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-xs font-bold shadow-xs'
                    }`}
                  >
                    {turn.content}
                  </div>
                </div>
              ))
            )}

            {/* Real-time live speech transcript buffer */}
            {candidateSpeechText && (
              <div className="flex flex-col items-end space-y-0.5 animate-in fade-in duration-100">
                <div className="flex items-center gap-1 text-[8px] font-black text-orange-500 uppercase tracking-wider">
                  <span className="h-1 w-1 rounded-full bg-orange-500 animate-ping" />
                  <span>Speaking...</span>
                </div>
                <div className="max-w-[90%] p-3 rounded-2xl bg-orange-500/15 border border-orange-500/25 text-[11px] font-semibold text-orange-950 dark:text-orange-100 rounded-tr-xs shadow-xs">
                  {candidateSpeechText}
                </div>
              </div>
            )}
          </div>

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
              className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80 mt-2"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={aiState === 'listening' ? "Or type your response..." : "Please wait for AI..."}
                disabled={aiState !== 'listening'}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 text-xs rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:focus:border-orange-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={aiState !== 'listening' || !textInput.trim()}
                className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-orange-600 dark:hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center cursor-pointer transition-all shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Floating Bottom Control Actions Pill */}
      <div className="mx-auto z-30 px-6 py-2.5 rounded-full border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl flex items-center gap-4 select-none">
        
        {/* Toggle Microphone */}
        <button
          type="button"
          onClick={() => setMicActive(!micActive)}
          className={`p-2.5 rounded-full border transition-all cursor-pointer ${
            micActive
              ? 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-750 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-750'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400 animate-pulse'
          }`}
          title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micActive ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
        </button>

        {/* Toggle Camera */}
        <button
          type="button"
          onClick={() => setCamActive(!camActive)}
          className={`p-2.5 rounded-full border transition-all cursor-pointer ${
            camActive
              ? 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-750 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-750'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400'
          }`}
          title={camActive ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {camActive ? <Video className="h-4.5 w-4.5" /> : <VideoOff className="h-4.5 w-4.5" />}
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Complete & Build Resume */}
        <button
          type="button"
          onClick={onEndCall}
          className="px-5 py-2 rounded-full bg-gradient-to-r from-brand-600 to-amber-600 dark:from-orange-600 dark:to-amber-600 hover:scale-[1.01] text-white text-[11px] font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
        >
          <PhoneOff className="h-3.5 w-3.5" />
          <span>Finish &amp; Build Resume</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  );
}
