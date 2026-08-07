'use client';

import React from 'react';
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
  onEndCall,
}: InterviewStageProps) {
  return (
    <div className="relative w-full h-[calc(100vh-6.5rem)] rounded-3xl overflow-hidden border border-white/60 dark:border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-900 dark:text-white shadow-2xl flex flex-col justify-between p-4 sm:p-5 backdrop-blur-md glass-panel select-none font-sans">
      
      {/* Background Ambient Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-orange-500/15 via-transparent to-transparent pointer-events-none" />

      {/* Top Modern Header */}
      <div className="flex items-center justify-between z-20 border-b border-slate-200/60 dark:border-slate-800/80 pb-3 px-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-500 dark:from-orange-500 dark:to-amber-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 dark:shadow-orange-500/20 flex-shrink-0">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">AI Voice Resume Session</span>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Live Call
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {targetRole} • {experienceLevel}
            </p>
          </div>
        </div>

        {/* Live Session Countdown Clock */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs sm:text-sm font-extrabold text-white shadow-md">
          <Clock className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>{formatTimer(timeRemaining)}</span>
        </div>
      </div>

      {/* Main 2-Tile Stage Grid (Full Height Fill, 50/50 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 my-3 flex-1 min-h-0 relative z-10">
        
        {/* Left Tile: Modern AI Presenter */}
        <div className="relative rounded-2xl border border-white/60 dark:border-slate-800/90 bg-white/60 dark:bg-slate-900/90 overflow-hidden flex flex-col items-center justify-between p-6 shadow-inner space-y-6">
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-bold text-slate-200">
              <span className={`h-2.5 w-2.5 rounded-full ${aiState === 'speaking' ? 'bg-orange-400 animate-ping' : 'bg-slate-500'}`} />
              {aiState === 'speaking' ? 'AI Speaking...' : aiState === 'evaluating' ? 'Thinking...' : 'AI Listening...'}
            </div>
          </div>

          {/* Futuristic Concentric Pulsing 3D AI Voice Orb */}
          <div className="relative flex items-center justify-center my-auto">
            <div
              className={`absolute h-52 w-52 sm:h-60 sm:w-60 rounded-full bg-orange-500/10 border border-orange-500/20 transition-all duration-700 ${
                aiState === 'speaking' ? 'scale-125 animate-ping opacity-30' : 'scale-90 opacity-10'
              }`}
            />
            <div
              className={`absolute h-40 w-40 sm:h-48 sm:w-48 rounded-full bg-amber-500/15 border border-amber-500/30 transition-all duration-500 ${
                aiState === 'speaking' ? 'scale-110 animate-pulse' : 'scale-95'
              }`}
            />
            
            <div className="relative h-32 w-32 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br from-brand-500 to-amber-500 dark:from-orange-500 dark:to-amber-600 flex items-center justify-center text-white shadow-[0_0_50px_rgba(249,115,22,0.4)]">
              <Bot className={`h-14 w-14 ${aiState === 'speaking' ? 'animate-bounce' : ''}`} />
            </div>
          </div>

          {/* AI Question Frosted Speech Card */}
          <div className="w-full max-w-lg text-center p-4 rounded-2xl bg-slate-950/90 border border-slate-800 border-t-2 border-t-orange-500 backdrop-blur-md shadow-xl space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400 block flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" /> Current AI Question
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-100 leading-relaxed">
              &ldquo;{currentTurn.aiMessage}&rdquo;
            </p>
          </div>

          {/* Audio Equalizer Spectrum */}
          <div className="flex items-center gap-1.5 h-6">
            {[30, 65, 95, 45, 80, 100, 55, 75, 40, 85, 70, 50, 90].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-200 ${
                  aiState === 'speaking' ? 'bg-orange-400 animate-pulse' : 'bg-slate-800'
                }`}
                style={{ height: aiState === 'speaking' ? `${Math.max(20, h * 0.85)}%` : '20%' }}
              />
            ))}
          </div>
        </div>

        {/* Right Tile: Modern Candidate Stream */}
        <div className="relative rounded-2xl border border-white/60 dark:border-slate-800/90 bg-slate-950 overflow-hidden flex flex-col justify-between p-4 shadow-inner space-y-4">
          <div className="flex justify-between items-center z-20">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs font-bold text-slate-200">
              <span className={`h-2 w-2 rounded-full ${micActive ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              {micActive ? 'Mic Active' : 'Mic Muted'}
            </div>
          </div>

          {/* Full Candidate Video Stream */}
          <div className="relative flex-1 w-full my-1 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900 border border-slate-800/80 min-h-[240px]">
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
                <div className="h-20 w-20 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 border border-slate-700 shadow-md">
                  <User className="h-10 w-10" />
                </div>
                <span className="text-xs text-slate-400 font-bold">Camera Off</span>
              </div>
            )}

            {/* Recognized Candidate Speech Subtitles Overlay */}
            {candidateSpeechText && (
              <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-slate-950/95 border border-slate-800 backdrop-blur-md text-xs font-medium text-slate-100 shadow-xl animate-in fade-in duration-200">
                &ldquo;{candidateSpeechText}&rdquo;
              </div>
            )}
          </div>

          {/* Vocal Stream Waveform Indicator */}
          <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-mono">
            <span>Vocal Stream Connected</span>
            <div className="flex items-center gap-1 h-4">
              {[20, 50, 80, 40, 90, 60].map((h, idx) => (
                <div
                  key={idx}
                  className={`w-1 rounded-full ${micActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`}
                  style={{ height: micActive ? `${h}%` : '30%' }}
                />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Apple FaceTime Style Bottom Control Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-6 py-3 rounded-full border border-slate-700/80 bg-slate-900/90 backdrop-blur-xl shadow-2xl flex items-center gap-4 select-none">
        <button
          type="button"
          onClick={() => setMicActive(!micActive)}
          className={`p-3 rounded-full border transition-all cursor-pointer ${
            micActive
              ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
              : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
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
              ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
              : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
          }`}
          title={camActive ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {camActive ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        <div className="h-5 w-px bg-slate-700/80 mx-1" />

        {/* Primary Finish & Build ATS Resume Button */}
        <button
          type="button"
          onClick={onEndCall}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-brand-600 to-amber-600 dark:from-orange-600 dark:to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white text-xs font-black shadow-lg transition-all cursor-pointer flex items-center gap-2"
        >
          <PhoneOff className="h-4 w-4" />
          <span>Finish &amp; Build ATS Resume</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}
