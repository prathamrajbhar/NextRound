import React, { useRef, useEffect } from 'react';
import { Bot, User } from '@/lib/lucide-google-icons';
import { Message, InterviewConsoleMode } from './types';

interface ConsolePrimaryViewportProps {
  mode: InterviewConsoleMode;
  aiSpeaking: boolean;
  isAnalyzing: boolean;
  micActive: boolean;
  micLevel: number;
  lastMessage?: Message;
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
    <div className="relative rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-lg dark:shadow-2xl backdrop-blur-md">
      {!isVideoCall ? (
        <div className="flex flex-col items-center justify-center space-y-6 p-6 text-center">
          <div className="relative">
            <div
              className={`h-36 w-36 sm:h-44 sm:w-44 rounded-full flex items-center justify-center transition-all duration-300 ${
                aiSpeaking
                  ? 'bg-gradient-to-tr from-amber-500/30 via-brand-500/20 to-orange-500/40 border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.4)] animate-pulse'
                  : isAnalyzing
                  ? 'bg-gradient-to-tr from-indigo-500/30 via-purple-500/20 to-blue-500/40 border-2 border-indigo-400 shadow-[0_0_50px_rgba(99,102,241,0.4)]'
                  : 'bg-slate-950/80 border-2 border-slate-800 shadow-xl'
              }`}
            >
              <Bot className={`h-16 w-16 sm:h-20 sm:w-20 ${aiSpeaking ? 'text-amber-400' : isAnalyzing ? 'text-indigo-400' : 'text-slate-400'}`} />
            </div>

            {}
            <div className="flex items-center justify-center gap-1.5 mt-4 h-8">
              {[40, 70, 90, 60, 80, 50, 95, 65, 45].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    aiSpeaking
                      ? 'bg-amber-400 animate-pulse'
                      : micActive
                      ? 'bg-brand-500 dark:bg-orange-500'
                      : 'bg-slate-700'
                  }`}
                  style={{ height: aiSpeaking ? `${(h * micLevel) / 100}%` : micActive ? `${(h * micLevel) / 150}%` : '8px' }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1 max-w-sm">
            <h2 className="text-base font-extrabold text-white font-display">
              {aiSpeaking ? 'AI Interviewer Speaking...' : isAnalyzing ? 'Evaluating Response...' : 'Listening to Candidate...'}
            </h2>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              {lastMessage ? lastMessage.content : 'Welcome! The interview session has initialized. Speak clearly into your microphone.'}
            </p>
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

          {}
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800/80 text-[10px] font-extrabold text-slate-300 flex items-center gap-1.5 backdrop-blur-md shadow-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{mode === 'hr-recruiter' ? 'Remote Candidate Feed' : 'Hiring Manager'}</span>
          </div>

          {}
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

