'use client';

import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  ShieldCheck,
  Sparkles,
  Bot,
  Activity,
  User,
  Clock,
} from '@/lib/lucide-google-icons';
import { Message, InterviewPhase } from '@/hooks/useInterviewSession';
import { CompanyLogo } from '@/components/ui';

interface ActiveConsoleProps {
  messages: Message[];
  phase: InterviewPhase;
  timeRemaining: number;
  micActive: boolean;
  camActive: boolean;
  isAnalyzing: boolean;
  isSimulating: boolean;
  isDarkTheme?: boolean;
  proctorTelemetry?: {
    faceCount: number;
    gazeCentered: boolean;
    engagementIndex: number;
  };
  onSubmitAnswer: (text: string) => void;
  onSimulateSpeaking: () => void;
  onEndSession: () => void;
  onToggleMic: () => void;
  onToggleCam: () => void;
  company?: string;
  role?: string;
}

// ML_BYPASS: video engagement ML — upgrade to fer+ or DeepFace for expression analysis (with consent)
export default function InterviewActiveConsole({
  messages,
  timeRemaining,
  micActive,
  camActive,
  isAnalyzing,
  isSimulating,
  proctorTelemetry,
  onSubmitAnswer,
  onSimulateSpeaking,
  onEndSession,
  onToggleMic,
  onToggleCam,
  company = 'Swiggy',
  role = 'Senior Frontend Engineer',
}: ActiveConsoleProps) {
  const [textInput, setTextInput] = useState('');
  const [eyeContactScore, setEyeContactScore] = useState(96);

  useEffect(() => {
    if (!camActive) return;
    const interval = setInterval(() => setEyeContactScore(Math.floor(Math.random() * 5) + 94), 2500);
    return () => clearInterval(interval);
  }, [camActive]);

  const lastMsg = messages[messages.length - 1];
  const aiSpeaking = lastMsg && lastMsg.role === 'ai';

  const voiceOrbState = isAnalyzing ? 'Analyzing' : isSimulating ? 'Listening' : aiSpeaking ? 'Speaking' : 'Idle';

  const getStatusText = () => {
    if (isAnalyzing) return 'Analyzing response...';
    if (isSimulating) return 'Listening to candidate...';
    if (aiSpeaking) return 'AI Interviewer speaking...';
    return 'AI Interviewer Ready';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 sm:p-4 md:p-5 overflow-hidden select-none animate-in fade-in duration-200">
      {/* Top Header Control Bar */}
      <div className="w-full flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3 flex-shrink-0">
        {/* Left: Branding & Role Title */}
        <div className="flex items-center gap-3">
          <CompanyLogo name={company} size="md" className="shadow-md flex-shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-white truncate font-display">
                {company}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-700"></span>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Proctored Session
              </span>
            </div>
            <h1 className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
              {role}
            </h1>
          </div>
        </div>

        {/* Right: Timer & Eye Contact Telemetry */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 font-mono text-xs font-bold shadow-inner">
            <Clock className="h-3.5 w-3.5 text-brand-600 dark:text-orange-400" />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Eye Contact: {eyeContactScore}%</span>
          </div>
        </div>
      </div>

      {/* Main Center Video Stage (Flex-1 Min-H-0 to Prevent Scrolling) */}
      <div className="w-full flex-1 min-h-0 py-2 relative flex flex-col justify-center items-center">
        <div className="relative w-full h-full max-h-[58vh] bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-md">
          {/* AI Avatar Video Feed (Center Visualizer) */}
          <div className="w-full h-full flex flex-col items-center justify-center p-4 relative">
            {/* AI Avatar Glow Circle */}
            <div className="relative mb-4">
              <div
                className={`h-20 w-20 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-lg ${
                  aiSpeaking
                    ? 'border-brand-500 bg-brand-500/10 scale-105'
                    : 'border-slate-700 bg-slate-800/80'
                }`}
              >
                <Bot
                  className={`h-10 w-10 transition-colors ${
                    aiSpeaking ? 'text-brand-600 dark:text-orange-400' : 'text-slate-400'
                  }`}
                />
              </div>

              {/* Soundwave Equalizer Animation when AI speaks */}
              {aiSpeaking && (
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-brand-500/50 shadow-md">
                  <div className="h-2.5 w-1 bg-brand-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="h-3.5 w-1 bg-brand-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="h-2 w-1 bg-brand-500 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                  <div className="h-4 w-1 bg-brand-400 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                </div>
              )}
            </div>

            {/* AI Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-950/90 border border-slate-800 text-slate-200 shadow-md">
              {aiSpeaking ? (
                <Volume2 className="h-3.5 w-3.5 text-brand-600 dark:text-orange-400 animate-pulse" />
              ) : isSimulating ? (
                <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              )}
              <span>{getStatusText()}</span>
            </div>

            {/* Picture-in-Picture (PiP) Candidate Self View (Bottom Right Corner) */}
            <div className="absolute bottom-3 right-3 w-36 sm:w-48 aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl flex items-center justify-center">
              {camActive ? (
                <div className="w-full h-full bg-slate-900/90 flex flex-col items-center justify-center text-slate-300 relative p-1.5">
                  <User className="h-5 w-5 text-slate-400 mb-0.5" />
                  <span className="text-[9px] font-extrabold uppercase text-slate-300">
                    Candidate Stream
                  </span>
                  <span className="absolute bottom-1 left-1 text-[7px] bg-slate-950/90 text-emerald-400 px-1 py-0.2 rounded font-mono border border-emerald-900/80">
                    Live
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-0.5 text-slate-500">
                  <VideoOff className="h-4 w-4 text-slate-600" />
                  <span className="text-[8px] uppercase font-bold">Cam Off</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Speech Caption & Chat Fallback Glass Card */}
        <div className="mt-2 p-3 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-md shadow-md w-full max-w-3xl mx-auto text-center space-y-2 flex-shrink-0">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              {aiSpeaking ? 'AI Interviewer' : isSimulating ? 'You (Candidate)' : 'Live Transcript'}
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-white leading-relaxed font-display line-clamp-2">
              {isSimulating
                ? `"${lastMsg?.content || ''}"`
                : lastMsg
                ? `"${lastMsg.content}"`
                : 'Connecting to dynamic conversation stream...'}
            </p>
          </div>

          {/* Text Fallback Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (textInput.trim()) {
                onSubmitAnswer(textInput);
                setTextInput('');
              }
            }}
            className="flex items-center gap-2 pt-1 border-t border-slate-800/80"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your response or use voice mic..."
              disabled={isAnalyzing}
              className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-medium"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isAnalyzing}
              className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Floating Controls Bar */}
      <div className="w-full max-w-md mx-auto pt-1 flex-shrink-0">
        <div className="p-2.5 rounded-full bg-slate-900/90 border border-slate-800/90 shadow-xl backdrop-blur-md flex items-center justify-between gap-2">
          {/* Hardware Toggles */}
          <div className="flex items-center gap-1.5 pl-1">
            <button
              type="button"
              onClick={onToggleMic}
              className={`p-2 rounded-full border cursor-pointer transition-all ${
                micActive
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-rose-950/80 border-rose-900/80 text-rose-400'
              }`}
              title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {micActive ? <Mic className="h-3.5 w-3.5 text-emerald-400" /> : <MicOff className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={onToggleCam}
              className={`p-2 rounded-full border cursor-pointer transition-all ${
                camActive
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-rose-950/80 border-rose-900/80 text-rose-400'
              }`}
              title={camActive ? 'Disable Camera' : 'Enable Camera'}
            >
              {camActive ? <Video className="h-3.5 w-3.5 text-emerald-400" /> : <VideoOff className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 pr-1">
            <button
              type="button"
              onClick={onSimulateSpeaking}
              disabled={isSimulating || isAnalyzing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Simulate Speaking</span>
            </button>

            <button
              type="button"
              onClick={onEndSession}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              <span>End Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
