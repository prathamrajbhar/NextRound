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
  currentTurn: { aiMessage: string };
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

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversationHistory, candidateSpeechText]);

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 flex flex-col justify-between p-6 font-sans">
      
      {/* Voice Error Banner */}
      {voiceError && (
        <div className="absolute top-16 left-6 right-6 z-50 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center gap-2 text-xs font-semibold text-rose-400 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          <span>⚠️ {voiceError}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm font-bold text-white tracking-tight">
                AI Resume Builder Call
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {targetRole} • {experienceLevel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs font-bold text-slate-200 shadow-sm">
          <Clock className="h-3.5 w-3.5 text-orange-400" />
          <span>{formatTimer(timeRemaining)}</span>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-4 flex-1 min-h-0">
        
        {/* Left Video / Voice Box */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col justify-between">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${aiState === 'speaking' ? 'bg-orange-400 animate-pulse' : aiState === 'evaluating' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
              {aiState === 'speaking' ? 'AI Lead Speaking' : aiState === 'evaluating' ? 'AI Reviewing Response' : 'Listening to Candidate'}
            </div>

            <div className="flex items-center gap-1 h-4 px-2">
              {[45, 80, 55, 95, 65, 85, 40, 70].map((h, i) => (
                <div
                  key={i}
                  className={`w-0.5 rounded-full transition-all ${
                    aiState === 'speaking'
                      ? 'bg-orange-400 animate-pulse'
                      : micActive && micLevel > 10
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-slate-800'
                  }`}
                  style={{
                    height: aiState === 'speaking' ? `${h}%` : micActive ? `${(h * micLevel) / 100}%` : '30%',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center my-3 relative min-h-[320px]">
            {camActive ? (
              <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-950 border border-slate-800 shadow-md">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover transform -scale-x-100"
                />
                {micActive && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-bold text-emerald-400">
                    <Mic className="h-3 w-3 animate-pulse" />
                    <span>Mic Live</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div
                  className={`h-20 w-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-orange-400 shadow-md transition-all ${
                    aiState === 'speaking' ? 'border-orange-500/50 bg-orange-500/10' : ''
                  }`}
                >
                  <Bot className="h-9 w-9" />
                </div>
                <span className="text-[11px] font-medium text-slate-400 mt-4 block">
                  {aiState === 'speaking' ? 'AI Lead Speaking' : 'Listening...'}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* Interviewer Speech Card */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> Interviewer Dialogue
                </span>
                {onReplayAudio && (
                  <button
                    type="button"
                    onClick={onReplayAudio}
                    className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-white transition-colors px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 cursor-pointer"
                  >
                    <Volume2 className="h-3 w-3" />
                    <span>Play Audio</span>
                  </button>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                &ldquo;{currentTurn.aiMessage}&rdquo;
              </p>
            </div>

            {/* AI Advice Hint */}
            {realtimeInsight && (
              <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 block">
                  ✦ Resume Extraction Tip
                </span>
                <p className="text-[11px] font-medium text-amber-200/90 mt-0.5">
                  {realtimeInsight}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Conversation History */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col justify-between">
          
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
            <span className="text-xs font-bold text-slate-300">
              Conversation History
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800">
              {conversationHistory.length} turns
            </span>
          </div>

          <div
            ref={chatScrollRef}
            className="flex-1 w-full overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800"
            style={{ maxHeight: 'calc(100vh - 22rem)' }}
          >
            {conversationHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500">
                <User className="h-6 w-6" />
                <p className="text-[11px] font-medium">
                  Connection established. Speak to begin!
                </p>
              </div>
            ) : (
              conversationHistory.map((turn, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${turn.role === 'candidate' ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-500 uppercase tracking-wider px-1">
                    <span>{turn.role === 'candidate' ? 'You' : 'AI Lead'}</span>
                    <span>•</span>
                    <span>{turn.timestamp || 'Just now'}</span>
                  </div>

                  <div
                    className={`max-w-[88%] p-3 rounded-xl text-xs leading-relaxed ${
                      turn.role === 'candidate'
                        ? 'bg-orange-600 text-white font-medium'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 font-medium'
                    }`}
                  >
                    {turn.content}
                  </div>
                </div>
              ))
            )}

            {candidateSpeechText && (
              <div className="flex flex-col items-end space-y-1">
                <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider px-1">
                  Speaking...
                </span>
                <div className="max-w-[88%] p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs font-medium text-orange-200">
                  {candidateSpeechText}
                </div>
              </div>
            )}
          </div>

          {/* Text Response Form */}
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
              className="relative flex items-center gap-2 pt-3 border-t border-slate-800/80 mt-3"
            >
              <div className="relative flex-1 flex items-center">
                <button
                  type="button"
                  onClick={() => setMicActive(!micActive)}
                  className={`absolute left-3 p-1 rounded-md transition-colors cursor-pointer ${
                    micActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>

                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={aiState === 'listening' ? "Type your response..." : "Please wait for AI..."}
                  disabled={aiState !== 'listening'}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-900 border border-slate-800 text-xs rounded-xl focus:outline-none focus:border-orange-500 text-white placeholder-slate-500 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={aiState !== 'listening' || !textInput.trim()}
                  className="absolute right-2 p-1 text-slate-400 hover:text-orange-400 disabled:opacity-30 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>

      </div>

      {/* Minimalist Bottom Control Bar */}
      <div className="mx-auto px-5 py-2 rounded-xl border border-slate-800 bg-slate-900 flex items-center gap-3 select-none shadow-lg">
        <button
          type="button"
          onClick={() => setMicActive(!micActive)}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            micActive
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
          title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={() => setCamActive(!camActive)}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            camActive
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
          title={camActive ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {camActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={onEndCall}
          className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <PhoneOff className="h-3.5 w-3.5" />
          <span>Finish &amp; Build Resume</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
