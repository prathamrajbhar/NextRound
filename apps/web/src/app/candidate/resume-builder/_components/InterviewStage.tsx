'use client';

import React, { useState } from 'react';
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
} from '@/lib/lucide-google-icons';

interface InterviewStageProps {
  targetRole: string;
  experienceLevel: string;
  timeRemaining: number;
  formatTimer: (sec: number) => string;
  aiState: 'speaking' | 'listening' | 'evaluating';
  currentTurn: { aiMessage: string; simulatedUserAnswer: string };
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

  return (
    <div className="relative w-full h-[calc(100vh-6.5rem)] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white shadow-2xl flex flex-col justify-between p-6 select-none font-sans">
      
      {/* Background Ambient Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-brand-500/5 dark:from-orange-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Voice Error Banner */}
      {voiceError && (
        <div className="absolute top-20 left-6 right-6 z-50 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 shadow-md">
          <span>⚠️ {voiceError}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between z-20 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-500 dark:from-orange-500 dark:to-amber-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 dark:shadow-orange-500/20 flex-shrink-0">
            <Bot className="h-5.5 w-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight font-display">AI Voice Resume Session</span>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Live
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {targetRole} • {experienceLevel}
            </p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 shadow-xs">
          <Clock className="h-4 w-4 text-emerald-500 dark:text-emerald-400 animate-pulse" />
          <span>{formatTimer(timeRemaining)}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4 flex-1 min-h-0 relative z-10">
        
        {/* Left Card: AI Presenter & Prompts */}
        <div className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800/90 bg-white/70 dark:bg-slate-900/70 overflow-hidden flex flex-col items-center justify-between p-6 shadow-sm">
          
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <span className={`h-2 w-2 rounded-full ${aiState === 'speaking' ? 'bg-orange-500 animate-pulse' : aiState === 'evaluating' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
              {aiState === 'speaking' ? 'AI Speaking' : aiState === 'evaluating' ? 'Thinking' : 'Listening'}
            </div>
          </div>

          {/* AI Voice Orb */}
          <div className="relative flex items-center justify-center my-auto">
            <div
              className={`absolute h-48 w-48 sm:h-56 sm:w-56 rounded-full bg-brand-500/10 dark:bg-orange-500/5 border border-brand-500/20 dark:border-orange-500/20 transition-all duration-700 ${
                aiState === 'speaking' ? 'scale-125 animate-pulse opacity-40' : 'scale-95 opacity-0'
              }`}
            />
            
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-brand-500 to-amber-500 dark:from-orange-500 dark:to-amber-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 dark:shadow-orange-500/30">
              <Bot className={`h-12 w-12 ${aiState === 'speaking' ? 'animate-bounce' : ''}`} />
            </div>
          </div>

          {/* Frosted Text Blocks */}
          <div className="w-full space-y-3.5">
            {/* AI Prompt Block */}
            <div className="w-full p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-brand-600 dark:text-orange-400 block flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Interviewer Prompts
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed font-display">
                &ldquo;{currentTurn.aiMessage}&rdquo;
              </p>
            </div>

            {/* Live extraction tips */}
            {realtimeInsight && (
              <div className="w-full p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-center animate-in fade-in duration-300">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-0.5">
                  ✦ Extraction Metric Target
                </span>
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 leading-relaxed">
                  {realtimeInsight}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Candidate Video Feed & Transcription */}
        <div className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800/90 bg-white/70 dark:bg-slate-900/70 overflow-hidden flex flex-col justify-between p-6 shadow-sm">
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <span className={`h-2 w-2 rounded-full ${micActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {micActive ? 'Mic Active' : 'Mic Muted'}
            </div>
          </div>

          {/* Webcam Port */}
          <div className="relative flex-1 w-full my-4 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 min-h-[220px]">
            {camActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-800 shadow-xs">
                  <User className="h-8 w-8" />
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Camera Off</span>
              </div>
            )}
          </div>

          {/* Real-time speech result & textbox fallback */}
          <div className="space-y-3.5">
            {candidateSpeechText && (
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs animate-in fade-in duration-200">
                &ldquo;{candidateSpeechText}&rdquo;
              </div>
            )}

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
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={aiState === 'listening' ? "Type response fallback..." : "Please wait..."}
                  disabled={aiState !== 'listening'}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:focus:border-orange-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={aiState !== 'listening' || !textInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-orange-600 dark:hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center cursor-pointer transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* Floating Dock Controls */}
      <div className="mx-auto z-30 px-6 py-3 rounded-full border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg flex items-center gap-4 select-none">
        <button
          type="button"
          onClick={() => setMicActive(!micActive)}
          className={`p-3 rounded-full border transition-all cursor-pointer ${
            micActive
              ? 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400'
          }`}
          title={micActive ? 'Mute Mic' : 'Unmute Mic'}
        >
          {micActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

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

