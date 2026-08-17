'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocalMediaStream } from '@/hooks/useLocalMediaStream';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';
import {
  InterviewConsoleMode,
  UnifiedInterviewConsoleProps,
} from './console/types';
import { formatSeconds } from './console/format';
import { ConsoleHeader } from './console/ConsoleHeader';
import { ConsolePrimaryViewport } from './console/ConsolePrimaryViewport';
import { ConsoleSecondaryViewport } from './console/ConsoleSecondaryViewport';
import { ConsoleTranscriptDrawer } from './console/ConsoleTranscriptDrawer';
import { ConsoleControlBar } from './console/ConsoleControlBar';
import { ConsoleExitConfirm } from './console/ConsoleExitConfirm';
import { ProctoringWarningModal } from './ProctoringWarningModal';

export type { InterviewConsoleMode, UnifiedInterviewConsoleProps };

export function UnifiedInterviewConsole({
  applicationId,
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
  onCompleteHRRound,
  strikeCount = 0,
  showWarningModal = false,
  onResumeFullscreen,
  onEliminate,
  proctoringClient,
}: UnifiedInterviewConsoleProps) {

  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);

  const [textInput, setTextInput] = useState('');
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [hrNotes, setHrNotes] = useState('');
  const [hrDecision, setHrDecision] = useState<'pass' | 'fail' | null>(null);

  const { stopLocalStream, hasCamPermission, micLevel, localStream } = useLocalMediaStream({
    videoRef,
    camActive,
    micActive,
    onStreamCreated: (stream) => {
      if (proctoringClient) {
        proctoringClient.trackMediaStream(stream);
      }
    },
  });

  const { remoteStream, connectionState } = useWebRTCCall({
    applicationId: applicationId || '',
    mode,
    localStream,
  });

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
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error('Failed to exit fullscreen:', err);
        });
      }
    }
  };

  const handleEndSession = () => {
    stopLocalStream();
    onEndSession();
  };

  const timeLabel = formatSeconds(mode === 'hr-recruiter' || mode === 'hr-candidate' ? callDuration : timeRemaining);
  const showTranscriptToggle = mode === 'ai-voice' || mode === 'mock-practice';

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans overflow-hidden select-none transition-colors duration-300">
      <ConsoleHeader
        mode={mode}
        companyName={companyName}
        jobTitle={jobTitle}
        phase={phase}
        isAnalyzing={isAnalyzing}
        aiSpeaking={aiSpeaking}
        proctorTelemetry={proctorTelemetry}
        timeLabel={timeLabel}
        showTranscriptToggle={showTranscriptToggle}
        showTranscriptDrawer={showTranscriptDrawer}
        onToggleTranscript={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
        onToggleFullscreen={toggleFullscreen}
      />

      <main className={`flex-1 p-3 sm:p-4 min-h-0 relative z-20 overflow-hidden grid gap-4 ${
        mode === 'hr-candidate' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
      }`}>
        <ConsolePrimaryViewport
          mode={mode}
          aiSpeaking={aiSpeaking}
          isAnalyzing={isAnalyzing}
          micActive={micActive}
          micLevel={micLevel}
          lastMessage={lastMsg}
          candidateName={candidateName}
          companyName={companyName}
          remoteStream={remoteStream}
          connectionState={connectionState}
          localStream={localStream}
        />

        {mode !== 'hr-candidate' && (
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
        )}
      </main>

      {showTranscriptDrawer && (
        <ConsoleTranscriptDrawer messages={messages} onClose={() => setShowTranscriptDrawer(false)} transcriptEndRef={transcriptEndRef} />
      )}

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

      <ConsoleExitConfirm isOpen={showExitConfirm} onCancel={() => setShowExitConfirm(false)} onConfirm={handleEndSession} />

      <ProctoringWarningModal
        isOpen={showWarningModal}
        strikeCount={strikeCount}
        onResumeFullscreen={onResumeFullscreen || (() => {})}
        onEliminate={onEliminate}
      />
    </div>
  );
}

export default UnifiedInterviewConsole;
