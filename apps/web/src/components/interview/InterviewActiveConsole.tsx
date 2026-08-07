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
  Maximize2,
  Wifi,
  AlertCircle,
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
  isDarkTheme?: boolean;
  proctorTelemetry?: {
    faceCount: number | null;
    gazeCentered: boolean | null;
    engagementIndex: number | null;
  };
  onSubmitAnswer: (text: string) => void;
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
  onSubmitAnswer,
  onEndSession,
  onToggleMic,
  onToggleCam,
  company = 'Google',
  role = 'Software Engineer',
}: ActiveConsoleProps) {
  const [textInput, setTextInput] = useState('');
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Real HTML5 Webcam Stream setup
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamPermission, setHasCamPermission] = useState<boolean | null>(null);
  const [micLevel, setMicLevel] = useState<number>(45);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function setupWebcam() {
      if (!camActive) {
        if (currentStream) {
          currentStream.getTracks().forEach((track) => track.stop());
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: micActive,
        });

        currentStream = stream;
        setHasCamPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Web Audio API volume level detection
        if (micActive) {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
              if (!currentStream || !currentStream.active) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              setMicLevel(Math.min(100, Math.max(15, Math.floor((avg / 128) * 100))));
              requestAnimationFrame(updateLevel);
            };
            updateLevel();
          } catch (e) {
            console.warn('Audio Context failed:', e);
          }
        }
      } catch (err) {
        console.warn('Webcam error:', err);
        setHasCamPermission(false);
      }
    }

    setupWebcam();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [camActive, micActive]);

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
    <div className="fixed inset-0 w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      
      {/* Top Video Call Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950 px-4 sm:px-6 flex items-center justify-between z-30 flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <CompanyLogo name={company} size="md" className="shadow-md flex-shrink-0 border border-slate-700/60" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white truncate font-display">
                {company}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" /> LIVE PROCTORED CALL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {role}
            </p>
          </div>
        </div>

        {/* Right Telemetry & Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-400">
            <Eye className="h-3.5 w-3.5 text-emerald-400" />
            <span>Gaze: {camActive ? 'Analyzing' : 'Disabled'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono font-medium">
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px]">1080p HD</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs font-bold">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showTranscriptDrawer
                ? 'bg-brand-600 text-white border-brand-500'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Transcript</span>
          </button>
        </div>
      </header>

      {/* Main Dual 50/50 Split Video Call Body */}
      <main className="flex-1 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 relative z-20 overflow-hidden">
        
        {/* Left Tile 50%: AI Interviewer Feed */}
        <div className="relative w-full h-full rounded-3xl border border-slate-800 bg-slate-900/90 overflow-hidden flex flex-col justify-between p-4 shadow-xl">
          
          {/* Top AI Status Header */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                AI Interactivity Node
              </span>
            </div>
            <div className={`px-3 py-1 rounded-full border text-xs font-extrabold flex items-center gap-2 shadow-md ${status.bg}`}>
              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
              {status.icon}
              <span>{status.text}</span>
            </div>
          </div>

          {/* Center AI Interviewer Avatar & Equalizer Aura */}
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 my-2">
            <div className="relative flex items-center justify-center">
              {aiSpeaking && (
                <>
                  <div className="absolute w-44 h-44 rounded-full border border-amber-500/30 animate-ping [animation-duration:2s]" />
                  <div className="absolute w-56 h-56 rounded-full border border-amber-500/20 animate-pulse" />
                </>
              )}
              <div
                className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-2 ${
                  aiSpeaking
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/30 border-amber-400 scale-105 shadow-amber-500/20'
                    : isAnalyzing
                    ? 'bg-gradient-to-br from-indigo-500/20 to-violet-600/30 border-indigo-400 scale-105 shadow-indigo-500/20'
                    : 'bg-slate-900 border-slate-700'
                }`}
              >
                <Bot
                  className={`h-12 w-12 sm:h-16 sm:w-16 transition-all duration-300 ${
                    aiSpeaking ? 'text-amber-400 scale-110' : 'text-slate-400'
                  }`}
                />
              </div>
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-base font-extrabold text-white font-display">Sarah • Lead AI Technical Interviewer</h3>
              <p className="text-xs text-slate-400 font-medium">Evaluating Architecture &amp; System Execution for {company}</p>
            </div>
          </div>

          {/* AI Spoken Speech Live Caption Box */}
          <div className="z-10 bg-slate-950/85 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">Live AI Question</span>
            <p className="text-xs text-slate-200 font-medium leading-relaxed line-clamp-3">
              {lastMsg?.role === 'ai' ? lastMsg.content : 'Waiting for the AI interviewer to begin...'}
            </p>
          </div>

        </div>

        {/* Right Tile 50%: Candidate Live Webcam Stream */}
        <div className="relative w-full h-full rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col justify-between shadow-xl">
          
          {camActive ? (
            <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {hasCamPermission === false && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-slate-300 p-6 text-center z-10">
                  <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
                  <span className="text-xs font-black uppercase text-slate-200">Webcam Stream Offline</span>
                  <span className="text-[10px] text-slate-400 max-w-xs mt-1">
                    Allow camera access in browser to see your video feed.
                  </span>
                </div>
              )}

              {/* Candidate Tile Overlay Header */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                <span className="text-xs font-extrabold text-white bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-400" /> You (Candidate)
                </span>

                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-900/80 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Encrypted Feed
                </span>
              </div>

              {/* Candidate Audio Volume Visualizer Overlay */}
              <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                <Mic className={`h-4 w-4 ${micActive ? 'text-emerald-400' : 'text-rose-400'}`} />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[9px] font-extrabold uppercase text-slate-400">
                    <span>Your Audio Input</span>
                    <span className={micActive ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                      {micActive ? `${micLevel}%` : 'MUTED'}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
                      style={{ width: micActive ? `${micLevel}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-2">
                <VideoOff className="h-8 w-8 text-rose-500" />
              </div>
              <span className="text-xs uppercase font-black text-rose-400">Camera Feed Off</span>
              <span className="text-[10px] text-slate-500 max-w-xs mt-1">
                Turn on your camera for proctored video evaluation.
              </span>
            </div>
          )}

        </div>

      </main>

      {/* Collapsible Transcript Side Drawer */}
      {showTranscriptDrawer && (
        <div className="absolute top-16 right-0 bottom-20 w-full sm:w-96 bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800 z-30 flex flex-col justify-between p-4 shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-400" /> Transcript History
            </h3>
            <button
              type="button"
              onClick={() => setShowTranscriptDrawer(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border ${
                  m.role === 'ai'
                    ? 'bg-slate-950 border-slate-800 text-slate-200'
                    : 'bg-brand-950/60 border-brand-900/80 text-brand-100 ml-4'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 mb-1">
                  <span>{m.role === 'ai' ? 'AI Interviewer' : 'You'}</span>
                  <span>{m.timestamp}</span>
                </div>
                <p className="leading-relaxed font-medium">{m.content}</p>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>

          <form onSubmit={handleFormSubmit} className="pt-2 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Type answer or use mic..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Call Dock Bar (Bottom Controls) */}
      <footer className="h-20 border-t border-slate-800 bg-slate-950 px-4 sm:px-6 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMic}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-extrabold ${
              micActive
                ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                : 'bg-rose-600 text-white border-rose-700'
            }`}
          >
            {micActive ? <Mic className="h-4.5 w-4.5 text-emerald-400" /> : <MicOff className="h-4.5 w-4.5 text-white" />}
            <span className="hidden sm:inline">{micActive ? 'Mute' : 'Unmute'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleCam}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-extrabold ${
              camActive
                ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                : 'bg-rose-600 text-white border-rose-700'
            }`}
          >
            {camActive ? <Video className="h-4.5 w-4.5 text-emerald-400" /> : <VideoOff className="h-4.5 w-4.5 text-white" />}
            <span className="hidden sm:inline">{camActive ? 'Stop Video' : 'Start Video'}</span>
          </button>
        </div>

        {/* Center Primary Action: Submit Response */}
        <button
          type="button"
          onClick={() => onSubmitAnswer(textInput.trim() || 'No response recorded.')}
          disabled={isAnalyzing}
          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="h-4.5 w-4.5" />
          <span>{isAnalyzing ? 'AI Evaluating...' : 'Submit Response'}</span>
        </button>

        {/* Right End Call Button */}
        <button
          type="button"
          onClick={onEndSession}
          className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <PhoneOff className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">End Session</span>
        </button>
      </footer>

    </div>
  );
}
