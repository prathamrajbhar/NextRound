'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare,
  X,
  Send,
  Eye,
  AudioLines,
  Maximize2,
  Wifi,
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

export default function InterviewActiveConsole({
  messages,
  timeRemaining,
  micActive,
  camActive,
  isAnalyzing,
  isSimulating,
  onSubmitAnswer,
  onSimulateSpeaking,
  onEndSession,
  onToggleMic,
  onToggleCam,
  company = 'Swiggy',
  role = 'Senior Frontend Engineer',
}: ActiveConsoleProps) {
  const [textInput, setTextInput] = useState('');
  const [eyeContactScore, setEyeContactScore] = useState(97);
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Eye contact telemetry simulation
  useEffect(() => {
    if (!camActive) return;
    const interval = setInterval(() => {
      const variation = Math.floor(Math.random() * 5) - 2;
      setEyeContactScore((prev) => Math.min(100, Math.max(90, prev + variation)));
    }, 3000);
    return () => clearInterval(interval);
  }, [camActive]);

  // Auto-scroll transcript drawer
  useEffect(() => {
    if (showTranscriptDrawer) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showTranscriptDrawer]);

  const lastMsg = messages[messages.length - 1];
  const aiSpeaking = lastMsg && lastMsg.role === 'ai';

  const getStatusBadge = () => {
    if (isAnalyzing) {
      return {
        text: 'Analyzing Response...',
        bg: 'bg-indigo-950/80 border-indigo-700/60 text-indigo-300',
        dot: 'bg-indigo-400 animate-ping',
        icon: <Activity className="h-3.5 w-3.5 text-indigo-400 animate-spin" />,
      };
    }
    if (isSimulating) {
      return {
        text: 'Candidate Speaking (Listening)',
        bg: 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300',
        dot: 'bg-emerald-400 animate-pulse',
        icon: <AudioLines className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />,
      };
    }
    if (aiSpeaking) {
      return {
        text: 'AI Interviewer Speaking',
        bg: 'bg-amber-950/80 border-amber-700/60 text-amber-300',
        dot: 'bg-amber-400 animate-pulse',
        icon: <Volume2 className="h-3.5 w-3.5 text-amber-400 animate-pulse" />,
      };
    }
    return {
      text: 'AI Interviewer Ready',
      bg: 'bg-slate-900/90 border-slate-700 text-slate-300',
      dot: 'bg-emerald-500',
      icon: <Sparkles className="h-3.5 w-3.5 text-brand-400" />,
    };
  };

  const status = getStatusBadge();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreenMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isAnalyzing) return;
    onSubmitAnswer(textInput);
    setTextInput('');
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      {/* Dynamic Background Studio Mesh Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] opacity-20 transition-all duration-700 ${
            aiSpeaking
              ? 'bg-amber-500/30'
              : isSimulating
              ? 'bg-emerald-500/30'
              : isAnalyzing
              ? 'bg-indigo-500/30'
              : 'bg-brand-500/20'
          }`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Top Header Control Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-30 flex-shrink-0 shadow-lg">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <CompanyLogo name={company} size="md" className="shadow-md flex-shrink-0 border border-slate-700/60" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white truncate font-display tracking-tight">
                {company}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-800/80 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <ShieldCheck className="h-3 w-3" /> Proctored Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {role}
            </p>
          </div>
        </div>

        {/* Right Telemetry & Timer */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Eye Contact Telemetry */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${
              camActive
                ? 'bg-slate-900/90 border-slate-800 text-emerald-400'
                : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-emerald-400" />
            <span>Gaze: {camActive ? `${eyeContactScore}%` : 'Disabled'}</span>
          </div>

          {/* Connection Quality Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-mono font-medium">
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px]">1080p HD</span>
          </div>

          {/* Time Remaining Counter */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-200 font-mono text-xs font-bold shadow-inner">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreenMode}
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Studio Viewport (Flex-1) */}
      <main className="flex-1 relative p-3 sm:p-5 flex flex-col items-center justify-center min-h-0 z-20">
        <div className="w-full h-full max-w-6xl relative rounded-3xl border border-slate-800/80 bg-slate-950/70 backdrop-blur-2xl shadow-2xl flex flex-col justify-between overflow-hidden">
          
          {/* Studio HUD Frame Corners */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-slate-700/80 rounded-tl-md pointer-events-none" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-slate-700/80 rounded-tr-md pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-slate-700/80 rounded-bl-md pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-slate-700/80 rounded-br-md pointer-events-none" />

          {/* Top Stage Bar inside Video */}
          <div className="w-full p-4 flex items-center justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-300 font-mono tracking-wider uppercase">
                AI Voice Synthesizer v2.4
              </span>
            </div>

            {/* AI Status Badge */}
            <div className={`px-3 py-1 rounded-full border text-xs font-extrabold flex items-center gap-2 backdrop-blur-md shadow-lg pointer-events-auto transition-all ${status.bg}`}>
              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
              {status.icon}
              <span>{status.text}</span>
            </div>
          </div>

          {/* Center AI Interviewer Node Visualizer */}
          <div className="flex-1 flex flex-col items-center justify-center relative p-4 z-10">
            {/* Animated Equalizer Rings */}
            <div className="relative flex items-center justify-center">
              {/* Pulse Outer Aura Rings */}
              {aiSpeaking && (
                <>
                  <div className="absolute w-44 h-44 rounded-full border border-amber-500/30 animate-ping [animation-duration:2s]" />
                  <div className="absolute w-56 h-56 rounded-full border border-amber-500/20 animate-pulse" />
                </>
              )}

              {isSimulating && (
                <>
                  <div className="absolute w-44 h-44 rounded-full border border-emerald-500/30 animate-ping [animation-duration:2s]" />
                  <div className="absolute w-56 h-56 rounded-full border border-emerald-500/20 animate-pulse" />
                </>
              )}

              {/* Main Avatar Core Orb */}
              <div
                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-2 ${
                  aiSpeaking
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/30 border-amber-400 scale-105 shadow-amber-500/20'
                    : isSimulating
                    ? 'bg-gradient-to-br from-emerald-500/20 to-teal-600/30 border-emerald-400 scale-105 shadow-emerald-500/20'
                    : isAnalyzing
                    ? 'bg-gradient-to-br from-indigo-500/20 to-violet-600/30 border-indigo-400 scale-105 shadow-indigo-500/20'
                    : 'bg-slate-900/90 border-slate-700 shadow-slate-900/50'
                }`}
              >
                <Bot
                  className={`h-12 w-12 sm:h-14 sm:w-14 transition-all duration-300 ${
                    aiSpeaking
                      ? 'text-amber-400 scale-110'
                      : isSimulating
                      ? 'text-emerald-400 scale-110'
                      : isAnalyzing
                      ? 'text-indigo-400 animate-pulse'
                      : 'text-slate-400'
                  }`}
                />

                {/* Animated Equalizer Waveform Overlay */}
                {aiSpeaking && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-1 bg-slate-950/90 px-3 py-1 rounded-full border border-amber-500/40 shadow-xl">
                    <span className="w-1 bg-amber-400 rounded-full h-3 animate-bounce [animation-delay:0.1s]" />
                    <span className="w-1 bg-amber-400 rounded-full h-5 animate-bounce [animation-delay:0.25s]" />
                    <span className="w-1 bg-amber-400 rounded-full h-2 animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1 bg-amber-400 rounded-full h-6 animate-bounce [animation-delay:0.3s]" />
                    <span className="w-1 bg-amber-400 rounded-full h-3.5 animate-bounce [animation-delay:0.2s]" />
                  </div>
                )}
              </div>
            </div>

            {/* AI Name Label */}
            <div className="mt-5 text-center">
              <h2 className="text-base sm:text-lg font-extrabold text-white font-display tracking-wide">
                AI HR Evaluator
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Evaluating Technical & Soft Skills for <span className="text-slate-200 font-bold">{company}</span>
              </p>
            </div>
          </div>

          {/* Candidate Stream PIP Tile (Bottom Right Corner) */}
          <div className="absolute bottom-4 right-4 z-20 w-44 sm:w-56 aspect-video rounded-2xl bg-slate-950 border-2 border-slate-700/80 overflow-hidden shadow-2xl transition-all group">
            {camActive ? (
              <div className="w-full h-full bg-slate-900/90 flex flex-col items-center justify-center relative p-2">
                <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-1 text-slate-300">
                  <User className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase text-slate-300 tracking-wider">
                  You (Candidate)
                </span>

                {/* Candidate Live Mic Audio Indicator Bar */}
                {isSimulating && (
                  <div className="absolute top-2 right-2 flex items-end gap-0.5 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                    <span className="w-0.5 bg-emerald-400 h-2 animate-pulse" />
                    <span className="w-0.5 bg-emerald-400 h-3 animate-pulse [animation-delay:0.1s]" />
                    <span className="w-0.5 bg-emerald-400 h-1.5 animate-pulse [animation-delay:0.2s]" />
                  </div>
                )}

                <div className="absolute bottom-1.5 left-1.5 text-[8px] bg-slate-950/90 text-emerald-400 px-1.5 py-0.5 rounded font-mono border border-emerald-900/80 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live WebRTC
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-500 gap-1">
                <VideoOff className="h-6 w-6 text-slate-600" />
                <span className="text-[9px] uppercase font-bold text-slate-400">Camera Off</span>
              </div>
            )}

            {/* Hover overlay quick mic toggle on PIP */}
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={onToggleMic}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                title={micActive ? 'Mute Mic' : 'Unmute Mic'}
              >
                {micActive ? <Mic className="h-4 w-4 text-emerald-400" /> : <MicOff className="h-4 w-4 text-red-400" />}
              </button>
              <button
                type="button"
                onClick={onToggleCam}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                title={camActive ? 'Disable Cam' : 'Enable Cam'}
              >
                {camActive ? <Video className="h-4 w-4 text-emerald-400" /> : <VideoOff className="h-4 w-4 text-red-400" />}
              </button>
            </div>
          </div>

          {/* Subtitle Caption & Text Input Fallback Bar (Bottom Center) */}
          <div className="w-full p-4 sm:p-5 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-10 space-y-3">
            {/* Live Caption Display Card */}
            <div className="max-w-3xl mx-auto p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl shadow-xl space-y-2 text-center">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {aiSpeaking ? 'AI Interviewer Speech' : isSimulating ? 'Your Speech Response' : 'Live Transcript'}
                </span>
                <span className="text-[9px] font-mono text-slate-500">Auto Captions ON</span>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed font-display line-clamp-3">
                {isSimulating
                  ? `"${lastMsg?.content || 'Speaking response to AI interviewer...'}"`
                  : lastMsg
                  ? `"${lastMsg.content}"`
                  : 'Initializing voice interview stream...'}
              </p>
            </div>

            {/* Input Fallback Bar */}
            <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your response or use microphone..."
                  disabled={isAnalyzing}
                  className="w-full bg-slate-950/90 border border-slate-800 focus:border-brand-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-medium pr-16 shadow-inner"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 pointer-events-none">
                  Press Enter
                </span>
              </div>

              <button
                type="submit"
                disabled={!textInput.trim() || isAnalyzing}
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-extrabold text-xs cursor-pointer transition-all shadow-lg flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Bottom Floating Control Dock */}
      <footer className="h-20 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-4 flex items-center justify-center z-30 flex-shrink-0 shadow-2xl">
        <div className="p-2 rounded-full bg-slate-900/90 border border-slate-800/90 shadow-2xl flex items-center gap-2 sm:gap-3 px-4">
          {/* Hardware Controls */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
            <button
              type="button"
              onClick={onToggleMic}
              className={`p-3 rounded-full transition-all cursor-pointer border ${
                micActive
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-emerald-400'
                  : 'bg-rose-950/80 border-rose-800 text-rose-400'
              }`}
              title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {micActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={onToggleCam}
              className={`p-3 rounded-full transition-all cursor-pointer border ${
                camActive
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-emerald-400'
                  : 'bg-rose-950/80 border-rose-800 text-rose-400'
              }`}
              title={camActive ? 'Disable Camera' : 'Enable Camera'}
            >
              {camActive ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onSimulateSpeaking}
            disabled={isSimulating || isAnalyzing}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Simulate Voice Response</span>
          </button>

          {/* Transcript Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
            className={`p-3 rounded-full transition-all cursor-pointer border ${
              showTranscriptDrawer
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Toggle Transcript Drawer"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          {/* End Session Button */}
          <div className="pl-2 border-l border-slate-800">
            <button
              type="button"
              onClick={onEndSession}
              className="px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <PhoneOff className="h-4 w-4" />
              <span>End Session</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Transcript Side Drawer */}
      {showTranscriptDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-400" />
              <h3 className="text-sm font-extrabold text-white font-display">
                Live Transcript History
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowTranscriptDrawer(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  msg.role === 'ai'
                    ? 'bg-slate-900/80 border-slate-800 text-slate-200'
                    : 'bg-brand-950/40 border-brand-900/60 text-brand-200 ml-4'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>{msg.role === 'ai' ? 'AI Interviewer' : 'You (Candidate)'}</span>
                  <span className="font-mono text-slate-500">{msg.timestamp || 'Live'}</span>
                </div>
                <p className="leading-relaxed font-medium">{msg.content}</p>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

