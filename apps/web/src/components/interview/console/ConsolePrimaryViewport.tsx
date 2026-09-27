import React, { useRef, useEffect } from 'react';
import { Bot, User, Volume2, Sparkles, Activity } from '@/lib/lucide-google-icons';
import { Message, InterviewConsoleMode } from './types';

interface ConsolePrimaryViewportProps {
  mode: InterviewConsoleMode;
  aiSpeaking: boolean;
  isAnalyzing: boolean;
  micActive: boolean;
  micLevel: number;
  lastMessage?: Message;
  candidateSpeechText?: string;
  candidateName: string;
  companyName: string;
  remoteStream?: MediaStream | null;
  connectionState?: RTCPeerConnectionState;
  localStream?: MediaStream | null;
}

export function ConsolePrimaryViewport({
  mode,
  aiSpeaking,
  isAnalyzing,
  micActive,
  micLevel,
  lastMessage,
  candidateSpeechText,
  candidateName,
  companyName,
  remoteStream,
  connectionState = 'new',
  localStream,
}: ConsolePrimaryViewportProps) {
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream || null;
    }
  }, [localStream]);

  const isVideoCall = mode === 'hr-candidate' || mode === 'hr-recruiter';
  const hasRemoteTracks = remoteStream && remoteStream.getVideoTracks().some(t => t.readyState === 'live');

  let callStatusText = 'Waiting for peer to join...';
  if (connectionState === 'connecting') {
    callStatusText = 'Establishing secure 1:1 WebRTC tunnel...';
  } else if (connectionState === 'connected') {
    callStatusText = hasRemoteTracks ? 'Live Encrypted Video Connected' : 'Resolving video tracks...';
  } else if (connectionState === 'disconnected' || connectionState === 'failed') {
    callStatusText = 'Connection interrupted. Reconnecting...';
  } else {
    callStatusText =
      mode === 'hr-recruiter'
        ? `Waiting for ${candidateName} to join...`
        : `Waiting for ${companyName} HR Representative...`;
  }

  return (
    <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800/90 overflow-hidden flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl">
      {/* Background ambient lighting glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-30">
        <div className={`w-96 h-96 rounded-full blur-3xl transition-all duration-700 ${
          aiSpeaking
            ? 'bg-amber-500/40 scale-125'
            : isAnalyzing
            ? 'bg-indigo-600/40 scale-110'
            : candidateSpeechText
            ? 'bg-emerald-500/30 scale-110'
            : 'bg-brand-600/20 scale-90'
        }`} />
      </div>

      {!isVideoCall ? (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-6 text-center select-none">
          {/* Top Status Pill */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full border text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1.5 backdrop-blur-md shadow-lg ${
              aiSpeaking
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                : isAnalyzing
                ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-950/80 border-slate-800 text-slate-300'
            }`}>
              {aiSpeaking ? (
                <>
                  <Volume2 className="h-3 w-3 text-amber-400 animate-pulse" />
                  <span>AI Voice Active</span>
                </>
              ) : isAnalyzing ? (
                <>
                  <Activity className="h-3 w-3 text-indigo-400 animate-spin" />
                  <span>Analyzing Turn</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 text-brand-400" />
                  <span>AI Interviewer Ready</span>
                </>
              )}
            </span>
          </div>

          {/* Central Animated Avatar & Visualizer */}
          <div className="flex flex-col items-center justify-center my-auto space-y-5">
            <div className="relative">
              {/* Outer pulsing ring */}
              <div
                className={`absolute -inset-4 rounded-full opacity-60 blur-md transition-all duration-500 ${
                  aiSpeaking
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-500 animate-pulse'
                    : isAnalyzing
                    ? 'bg-gradient-to-tr from-indigo-500 to-cyan-500 animate-spin'
                    : 'bg-gradient-to-tr from-brand-600 to-indigo-600'
                }`}
              />

              <div
                className={`relative h-32 w-32 sm:h-40 sm:w-40 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  aiSpeaking
                    ? 'bg-slate-950 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.35)]'
                    : isAnalyzing
                    ? 'bg-slate-950 border-indigo-400/80 shadow-[0_0_50px_rgba(99,102,241,0.35)]'
                    : 'bg-slate-950 border-slate-800 shadow-xl'
                }`}
              >
                <Bot
                  className={`h-14 w-14 sm:h-18 sm:w-18 transition-colors duration-300 ${
                    aiSpeaking ? 'text-amber-400' : isAnalyzing ? 'text-indigo-400' : 'text-slate-300'
                  }`}
                />
              </div>
            </div>

            {/* AI Waveform Equalizer */}
            <div className="flex items-center justify-center gap-1.5 h-7 px-4 py-1.5 rounded-full bg-slate-950/70 border border-slate-800/80 backdrop-blur-md">
              {[30, 60, 90, 50, 100, 70, 40, 85, 55, 35].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    aiSpeaking
                      ? 'bg-gradient-to-t from-amber-500 to-orange-400 animate-pulse'
                      : isAnalyzing
                      ? 'bg-gradient-to-t from-indigo-500 to-cyan-400'
                      : 'bg-slate-700'
                  }`}
                  style={{
                    height: aiSpeaking
                      ? `${Math.max(20, Math.floor(Math.sin((Date.now() / 150) + i) * 40 + 60))}%`
                      : '6px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bottom Card: Live Spoken Transcript or Last Question */}
          <div className="w-full max-w-lg space-y-2">
            {candidateSpeechText && !aiSpeaking && !isAnalyzing ? (
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)] text-left backdrop-blur-md transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Candidate Speaking...</span>
                </div>
                <p className="text-xs text-white font-medium leading-relaxed font-sans">
                  &ldquo;{candidateSpeechText}&rdquo;
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left backdrop-blur-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {aiSpeaking ? 'AI Prompt' : 'Current Topic'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {lastMessage ? lastMessage.timestamp : 'Turn 1'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed line-clamp-3">
                  {lastMessage ? lastMessage.content : 'Welcome! The interview session has initialized. Speak clearly into your microphone.'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
          {connectionState === 'connected' && hasRemoteTracks ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 select-none">
              <div className="h-24 w-24 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-slate-400 shadow-inner relative">
                <User className="h-12 w-12" />
                <span className="absolute inset-0 rounded-full border border-brand-500/20 animate-ping duration-1000" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-white font-display">
                  {mode === 'hr-recruiter' ? candidateName : `${companyName} HR Representative`}
                </h3>
                <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-extrabold text-slate-400 tracking-wide uppercase">
                  <span className={`h-1.5 w-1.5 rounded-full ${connectionState === 'connected' ? 'bg-amber-400 animate-pulse' : connectionState === 'connecting' ? 'bg-indigo-400 animate-ping' : 'bg-slate-600'}`} />
                  <span>{callStatusText}</span>
                </div>
              </div>
            </div>
          )}

          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800/80 text-[10px] font-extrabold text-slate-300 flex items-center gap-1.5 backdrop-blur-md shadow-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{mode === 'hr-recruiter' ? 'Remote Candidate Feed' : 'Hiring Manager'}</span>
          </div>

          {isVideoCall && localStream && (
            <div className="absolute bottom-4 right-4 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden border border-slate-200/20 dark:border-slate-800 bg-slate-950 shadow-2xl z-30 transition-all duration-300 group hover:scale-105">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[8px] font-extrabold text-slate-400">
                You
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
