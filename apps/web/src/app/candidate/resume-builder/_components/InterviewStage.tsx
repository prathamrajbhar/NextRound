'use client';

import React, { useState } from 'react';
import { InterviewHeader } from './InterviewHeader';
import { InterviewAiPanel } from './InterviewAiPanel';
import { InterviewUserPanel } from './InterviewUserPanel';
import { InterviewChatDrawer } from './InterviewChatDrawer';
import { InterviewControlBar } from './InterviewControlBar';

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
  onCancelCall?: () => void;
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
  candidateSpeechText,
  realtimeInsight,
  voiceError,
  onReplayAudio,
  onSubmitResponse,
  onCancelCall,
}: InterviewStageProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const lastCandidateTurn = [...conversationHistory]
    .reverse()
    .find((t) => t.role === 'candidate');

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] rounded-3xl border border-white/10 bg-slate-950/90 text-slate-100 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col justify-between p-6 font-sans">
      {voiceError && (
        <div className="absolute top-16 left-6 right-6 z-50 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2.5 text-xs font-semibold text-rose-400 backdrop-blur-xl shadow-lg">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          <span>⚠️ {voiceError}</span>
        </div>
      )}

      <InterviewHeader
        targetRole={targetRole}
        experienceLevel={experienceLevel}
        timeRemaining={timeRemaining}
        formatTimer={formatTimer}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onCancelCall={onCancelCall}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-4 flex-1 min-h-0">
        <InterviewAiPanel
          aiState={aiState}
          currentTurn={currentTurn}
          realtimeInsight={realtimeInsight}
          onReplayAudio={onReplayAudio}
          isChatOpen={isChatOpen}
        />

        <InterviewUserPanel
          micActive={micActive}
          camActive={camActive}
          videoRef={videoRef}
          candidateSpeechText={candidateSpeechText}
          lastCandidateTurnContent={lastCandidateTurn?.content}
          isChatOpen={isChatOpen}
        />

        {isChatOpen && (
          <InterviewChatDrawer
            conversationHistory={conversationHistory}
            aiState={aiState}
            candidateSpeechText={candidateSpeechText}
            onClose={() => setIsChatOpen(false)}
            onSubmitResponse={onSubmitResponse}
          />
        )}
      </div>

      <InterviewControlBar
        micActive={micActive}
        onToggleMic={() => setMicActive(!micActive)}
        camActive={camActive}
        onToggleCam={() => setCamActive(!camActive)}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onCancelCall={onCancelCall}
      />
    </div>
  );
}
