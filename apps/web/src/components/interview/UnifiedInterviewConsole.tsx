'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocalMediaStream } from '@/hooks/useLocalMediaStream';
import {
  InterviewConsoleMode,
  UnifiedInterviewConsoleProps,
  ScreeningQuestion,
} from './console/types';
import { formatSeconds } from './console/format';
import { ConsoleHeader } from './console/ConsoleHeader';
import { ConsolePrimaryViewport } from './console/ConsolePrimaryViewport';
import { ConsoleSecondaryViewport } from './console/ConsoleSecondaryViewport';
import { ConsoleTranscriptDrawer } from './console/ConsoleTranscriptDrawer';
import { ConsoleControlBar } from './console/ConsoleControlBar';
import { ConsoleExitConfirm } from './console/ConsoleExitConfirm';
import { useScreeningRecorder } from './console/useScreeningRecorder';

export type { InterviewConsoleMode, UnifiedInterviewConsoleProps };

const DEFAULT_SCREENING_QUESTIONS: ScreeningQuestion[] = [
  { questionId: 'q1', questionText: 'Tell us about your background and why you are interested in this role.', timeLimitSeconds: 120 },
  { questionId: 'q2', questionText: 'Describe a challenging technical problem you solved recently.', timeLimitSeconds: 180 },
];

/**
 * Unified interview console state machine covering all session modes:
 * ai-voice / mock-practice (AI orb + transcript), video-screening (recorded
 * responses), and hr-candidate / hr-recruiter (live WebRTC video + evaluation
 * form). Each visual region is delegated to a sub-component in ./console.
 */
export function UnifiedInterviewConsole({
  mode,
  companyName = 'Company',
  jobTitle = 'Candidate Position',
  candidateName = 'Candidate',
  timeRemaining = 1800,
  callDuration = 0,
  messages = [],
  phase = 'Introduction',
  isAnalyzing = false,
  proctorTelemetry,
  onSubmitAnswer,
  onEndSession,
  screeningQuestions = DEFAULT_SCREENING_QUESTIONS,
  onSubmitScreening,
  onCompleteHRRound,
}: UnifiedInterviewConsoleProps) {
  // Device & Stream States
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);

  // UI Drawer & Text Chat Fallback
  const [textInput, setTextInput] = useState('');
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // HR Round Form State
  const [hrNotes, setHrNotes] = useState('');
  const [hrDecision, setHrDecision] = useState<'pass' | 'fail' | null>(null);

  // Video Screening Recording State Machine
  const {
    screeningIdx,
    isRecording,
    recordingTimer,
    attempts,
    toggleRecording,
    nextQuestion,
  } = useScreeningRecorder({ screeningQuestions, onSubmitScreening });

  // Local webcam/mic stream lifecycle — owns the getUserMedia stream and stops all tracks
  // on unmount, pagehide, and when the session ends (via handleEndSession).
  const { stopLocalStream, hasCamPermission, micLevel } = useLocalMediaStream({
    videoRef,
    camActive,
    micActive,
  });

  // Auto-scroll transcript drawer
  useEffect(() => {
    if (showTranscriptDrawer) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showTranscriptDrawer]);

  const lastMsg = messages[messages.length - 1];
  const aiSpeaking = Boolean(lastMsg && lastMsg.role === 'ai');

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isAnalyzing || !onSubmitAnswer) return;
    onSubmitAnswer(textInput);
    setTextInput('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Release the camera/mic the moment the session ends, before async API calls + navigation.
  const handleEndSession = () => {
    stopLocalStream();
    onEndSession();
  };

  const timeLabel = formatSeconds(mode === 'hr-recruiter' || mode === 'hr-candidate' ? callDuration : timeRemaining);
  const showTranscriptToggle = mode === 'ai-voice' || mode === 'mock-practice';

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans overflow-hidden select-none transition-colors duration-300">
      {/* Header Bar */}
      <ConsoleHeader
        mode={mode}
        companyName={companyName}
        jobTitle={jobTitle}
        phase={phase}
        isAnalyzing={isAnalyzing}
        aiSpeaking={aiSpeaking}
        isRecording={isRecording}
        proctorTelemetry={proctorTelemetry}
        timeLabel={timeLabel}
        showTranscriptToggle={showTranscriptToggle}
        showTranscriptDrawer={showTranscriptDrawer}
        onToggleTranscript={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Main Dual-View Body */}
      <main className="flex-1 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 relative z-20 overflow-hidden">
        {/* Left Viewport: Primary Feed (AI Voice Orb OR Remote Video Feed OR Screening Question) */}
        <ConsolePrimaryViewport
          mode={mode}
          aiSpeaking={aiSpeaking}
          isAnalyzing={isAnalyzing}
          micActive={micActive}
          micLevel={micLevel}
          lastMessage={lastMsg}
          screeningQuestions={screeningQuestions}
          screeningIdx={screeningIdx}
          isRecording={isRecording}
          recordingTimer={recordingTimer}
          attempts={attempts}
          onScreeningRecordToggle={toggleRecording}
          onNextScreeningQuestion={nextQuestion}
          candidateName={candidateName}
          companyName={companyName}
        />

        {/* Right Viewport: Candidate Local Camera Feed OR Recruiter Evaluation Form */}
        <ConsoleSecondaryViewport
          mode={mode}
          candidateName={candidateName}
          camActive={camActive}
          hasCamPermission={hasCamPermission}
          videoRef={videoRef}
          hrNotes={hrNotes}
          hrDecision={hrDecision}
          onHrNotesChange={setHrNotes}
          onHrDecisionChange={setHrDecision}
          onCompleteHRRound={onCompleteHRRound}
        />
      </main>

      {/* Subtitle & Live Transcript Drawer Overlay */}
      {showTranscriptDrawer && (
        <ConsoleTranscriptDrawer messages={messages} onClose={() => setShowTranscriptDrawer(false)} transcriptEndRef={transcriptEndRef} />
      )}

      {/* Floating Bottom Control Bar */}
      <ConsoleControlBar
        micActive={micActive}
        camActive={camActive}
        onToggleMic={() => setMicActive((p) => !p)}
        onToggleCam={() => setCamActive((p) => !p)}
        showTextFallback={Boolean(onSubmitAnswer)}
        textInput={textInput}
        onTextInputChange={setTextInput}
        onTextSubmit={handleTextSubmit}
        isAnalyzing={isAnalyzing}
        onEndSession={() => setShowExitConfirm(true)}
      />

      {/* Exit Confirmation Modal */}
      <ConsoleExitConfirm isOpen={showExitConfirm} onCancel={() => setShowExitConfirm(false)} onConfirm={handleEndSession} />
    </div>
  );
}

export default UnifiedInterviewConsole;
