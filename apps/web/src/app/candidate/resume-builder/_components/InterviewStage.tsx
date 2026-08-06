'use client';

import React from 'react';
import {
  Bot,
  ShieldCheck,
  Sparkles,
  Clock,
  User,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff
} from '@/lib/lucide-google-icons';
import { InsightsDrawer } from './InsightsDrawer';

interface InterviewStageProps {
  targetRole: string;
  experienceLevel: string;
  timeRemaining: number;
  formatTimer: (sec: number) => string;
  showInsightsDrawer: boolean;
  setShowInsightsDrawer: (val: boolean) => void;
  extractedInsights: { type: string; label: string; value: string }[];
  aiState: 'speaking' | 'listening' | 'evaluating';
  currentTurn: { aiMessage: string; simulatedUserAnswer: string };
  videoRef: React.RefObject<HTMLVideoElement | null>;
  camActive: boolean;
  setCamActive: (val: boolean) => void;
  micActive: boolean;
  setMicActive: (val: boolean) => void;
  isSimulatingSpeech: boolean;
  candidateSpeechText: string;
  onSimulateAnswer: () => void;
  onEndCall: () => void;
}

export function InterviewStage({
  targetRole,
  experienceLevel,
  timeRemaining,
  formatTimer,
  showInsightsDrawer,
  setShowInsightsDrawer,
  extractedInsights,
  aiState,
  currentTurn,
  videoRef,
  camActive,
  setCamActive,
  micActive,
  setMicActive,
  isSimulatingSpeech,
  candidateSpeechText,
  onSimulateAnswer,
  onEndCall,
}: InterviewStageProps) {
  return (
    <div className="relative w-full h-[780px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 text-white shadow-2xl flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Top Control Bar */}
      <div className="flex items-center justify-between z-20 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-white">AI Resume Interview</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-emerald-400 bg-emerald-950/80 border border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold">{targetRole} • {experienceLevel}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInsightsDrawer(!showInsightsDrawer)}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Resume Highlights ({extractedInsights.length})
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 font-mono text-xs font-bold text-slate-200">
            <Clock className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>{formatTimer(timeRemaining)}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Tile Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-auto h-[560px] relative z-10">
        {/* Left Tile: AI Interviewer */}
        <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden flex flex-col items-center justify-center p-6 space-y-6 shadow-inner">
          <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-bold text-slate-300">
            <span className={`h-2 w-2 rounded-full ${aiState === 'speaking' ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            {aiState === 'speaking' ? 'AI Speaking...' : aiState === 'evaluating' ? 'Thinking...' : 'AI Listening...'}
          </div>

          {/* Glowing AI Orb */}
          <div className="relative flex items-center justify-center">
            <div className={`h-36 w-36 rounded-full bg-emerald-500/10 flex items-center justify-center transition-all duration-500 ${
              aiState === 'speaking' ? 'scale-110 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : ''
            }`}>
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl">
                <Bot className={`h-12 w-12 ${aiState === 'speaking' ? 'animate-bounce' : ''}`} />
              </div>
            </div>
          </div>

          {/* AI Spoken Question Box */}
          <div className="max-w-md text-center p-4 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-md">
            <p className="text-sm font-bold text-slate-100 leading-relaxed">
              &ldquo;{currentTurn.aiMessage}&rdquo;
            </p>
          </div>

          {/* Audio Output Spectrum */}
          <div className="flex items-center gap-1.5 h-6">
            {[30, 60, 90, 45, 80, 100, 50, 70, 40, 85, 65].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-200 ${
                  aiState === 'speaking' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-800'
                }`}
                style={{ height: aiState === 'speaking' ? `${Math.max(20, h * 0.8 + 20)}%` : '25%' }}
              />
            ))}
          </div>
        </div>

        {/* Right Tile: Candidate Video Feed */}
        <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden flex flex-col justify-between p-4 shadow-inner">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-bold text-slate-300">
              <span className={`h-2 w-2 rounded-full ${micActive ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              {isSimulatingSpeech ? 'Candidate Speaking...' : 'Mic Active'}
            </div>
          </div>

          {/* Video Feed */}
          <div className="relative h-full w-full my-2 flex items-center justify-center overflow-hidden rounded-xl bg-slate-950">
            {camActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="h-20 w-20 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <User className="h-10 w-10" />
                </div>
                <span className="text-xs text-slate-500 font-bold">Camera Off</span>
              </div>
            )}

            {candidateSpeechText && (
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md text-xs font-medium text-slate-200">
                &ldquo;{candidateSpeechText}&rdquo;
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-mono">
            <span>Vocal Stream Connected</span>
            <div className="flex items-center gap-1 h-4">
              {[20, 50, 80, 40, 90, 60].map((h, idx) => (
                <div
                  key={idx}
                  className={`w-1 rounded-full ${isSimulatingSpeech ? 'bg-orange-400 animate-pulse' : 'bg-slate-700'}`}
                  style={{ height: isSimulatingSpeech ? `${h}%` : '30%' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Dock */}
      <div className="flex items-center justify-between z-20 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMicActive(!micActive)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              micActive
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
            }`}
            title={micActive ? 'Mute Mic' : 'Unmute Mic'}
          >
            {micActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setCamActive(!camActive)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              camActive
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
            }`}
            title={camActive ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {camActive ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
        </div>

        <button
          onClick={onSimulateAnswer}
          disabled={isSimulatingSpeech || aiState === 'speaking'}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2"
        >
          <Mic className={`h-4 w-4 ${isSimulatingSpeech ? 'animate-bounce text-rose-400' : ''}`} />
          {isSimulatingSpeech ? 'Speaking Answer...' : 'Simulate Voice Answer'}
        </button>

        <button
          onClick={onEndCall}
          className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg transition-all cursor-pointer flex items-center gap-2"
        >
          <PhoneOff className="h-4 w-4" /> Finish & Build Resume
        </button>
      </div>

      {/* Insights Overlay */}
      {showInsightsDrawer && (
        <InsightsDrawer
          extractedInsights={extractedInsights}
          onClose={() => setShowInsightsDrawer(false)}
        />
      )}
    </div>
  );
}
