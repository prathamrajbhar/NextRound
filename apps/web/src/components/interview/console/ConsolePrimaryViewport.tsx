'use client';

import React from 'react';
import { Bot, Camera, PhoneOff, Play, CheckCircle2, User } from '@/lib/lucide-google-icons';
import { Message } from '@/hooks/useInterviewSession';
import { InterviewConsoleMode, ScreeningQuestion } from './types';
import { formatSeconds } from './format';

interface ConsolePrimaryViewportProps {
  mode: InterviewConsoleMode;
  aiSpeaking: boolean;
  isAnalyzing: boolean;
  micActive: boolean;
  micLevel: number;
  lastMessage?: Message;
  screeningQuestions: ScreeningQuestion[];
  screeningIdx: number;
  isRecording: boolean;
  recordingTimer: number;
  attempts: number;
  onScreeningRecordToggle: () => void;
  onNextScreeningQuestion: () => void;
  candidateName: string;
  companyName: string;
}

/**
 * Left viewport of the interview console. Renders the AI voice orb (ai-voice /
 * mock-practice), the video-screening question + recording controls, or the
 * human HR video placeholder.
 */
export function ConsolePrimaryViewport({
  mode,
  aiSpeaking,
  isAnalyzing,
  micActive,
  micLevel,
  lastMessage,
  screeningQuestions,
  screeningIdx,
  isRecording,
  recordingTimer,
  attempts,
  onScreeningRecordToggle,
  onNextScreeningQuestion,
  candidateName,
  companyName,
}: ConsolePrimaryViewportProps) {
  return (
    <div className="relative rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-lg dark:shadow-2xl backdrop-blur-md">
      {mode === 'ai-voice' || mode === 'mock-practice' ? (
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

            {/* Animated Audio Equalizer Wave Form */}
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
      ) : mode === 'video-screening' ? (
        <div className="p-6 space-y-5 text-center max-w-md">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-400 shadow-md">
            <Camera className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-400 bg-brand-950 border border-brand-800 px-2.5 py-1 rounded-full">
              Question {screeningIdx + 1} of {screeningQuestions.length}
            </span>
            <h2 className="text-lg font-black text-white font-display pt-1">
              {screeningQuestions[screeningIdx]?.questionText}
            </h2>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-semibold">
            <div className="flex justify-between text-slate-400">
              <span>Recording Timer:</span>
              <span className="text-rose-400 font-mono font-bold">{formatSeconds(recordingTimer)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Attempt Count:</span>
              <span className="text-slate-200">{attempts} / 3</span>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={onScreeningRecordToggle}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer ${
                isRecording ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-brand-600 hover:bg-brand-500 text-white'
              }`}
            >
              {isRecording ? <PhoneOff className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            </button>
            <button
              type="button"
              onClick={onNextScreeningQuestion}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <span>Next Question</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </button>
          </div>
        </div>
      ) : (
        // Human HR Video Stream
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-300">
            <User className="h-10 w-10" />
          </div>
          <h3 className="text-sm font-extrabold text-white font-display">
            {mode === 'hr-recruiter' ? candidateName : `${companyName} HR Representative`}
          </h3>
          <p className="text-xs text-slate-400 font-medium">Encrypted WebRTC 1:1 Video Stream Connected</p>
        </div>
      )}
    </div>
  );
}
