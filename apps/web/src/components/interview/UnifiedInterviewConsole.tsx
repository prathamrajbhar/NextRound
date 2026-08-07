'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  Sparkles,
  Bot,
  Activity,
  User,
  Clock,
  MessageSquare,
  X,
  Send,
  Eye,
  Wifi,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Camera,
  Play,
  Maximize2,
  Save,
} from '@/lib/lucide-google-icons';
import { Message, InterviewPhase } from '@/hooks/useInterviewSession';
import { CompanyLogo } from '@/components/ui';

export type InterviewConsoleMode =
  | 'ai-voice'
  | 'mock-practice'
  | 'hr-candidate'
  | 'hr-recruiter'
  | 'video-screening';

export interface UnifiedInterviewConsoleProps {
  mode: InterviewConsoleMode;
  companyName: string;
  jobTitle: string;
  candidateName?: string;
  avatarUrl?: string;
  timeRemaining?: number;
  callDuration?: number;

  // Voice & AI session state (for ai-voice and mock-practice)
  messages?: Message[];
  phase?: InterviewPhase;
  isAnalyzing?: boolean;
  proctorTelemetry?: {
    faceCount: number | null;
    gazeCentered: boolean | null;
    engagementIndex: number | null;
  };
  onSubmitAnswer?: (text: string) => void;
  onEndSession: () => void;

  // Video screening questions (for video-screening mode)
  screeningQuestions?: Array<{ questionId: string; questionText: string; timeLimitSeconds: number }>;
  onSubmitScreening?: (responses: Record<string, { duration: number; attempts: number }>) => void;

  // HR Recruiter Evaluation Form (for hr-recruiter mode)
  onCompleteHRRound?: (result: 'pass' | 'fail', notes: string) => void;
}

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
  screeningQuestions = [
    { questionId: 'q1', questionText: 'Tell us about your background and why you are interested in this role.', timeLimitSeconds: 120 },
    { questionId: 'q2', questionText: 'Describe a challenging technical problem you solved recently.', timeLimitSeconds: 180 },
  ],
  onSubmitScreening,
  onCompleteHRRound,
}: UnifiedInterviewConsoleProps) {
  // Device & Stream States
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [hasCamPermission, setHasCamPermission] = useState<boolean | null>(null);
  const [micLevel, setMicLevel] = useState<number>(45);

  // UI Drawer & Text Chat Fallback
  const [textInput, setTextInput] = useState('');
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // HR Round Form State
  const [hrNotes, setHrNotes] = useState('');
  const [hrDecision, setHrDecision] = useState<'pass' | 'fail' | null>(null);

  // Video Screening Recording States
  const [screeningIdx, setScreeningIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [recordedList, setRecordedList] = useState<Record<string, { duration: number; attempts: number }>>({});
  const [attempts, setAttempts] = useState(1);

  // WebCam Stream Setup
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function setupWebcam() {
      if (!camActive && !micActive) {
        if (currentStream) {
          currentStream.getTracks().forEach((track) => track.stop());
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: camActive ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
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
            const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtxClass) {
              const audioCtx = new AudioCtxClass();
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
            }
          } catch {
            // Audio context fallback
          }
        }
      } catch {
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

  // Video Screening Recording Timer
  useEffect(() => {
    if (mode !== 'video-screening' || !isRecording) return;
    const interval = setInterval(() => {
      setRecordingTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, isRecording]);

  // Auto-scroll transcript drawer
  useEffect(() => {
    if (showTranscriptDrawer) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showTranscriptDrawer]);

  const lastMsg = messages[messages.length - 1];
  const aiSpeaking = lastMsg && lastMsg.role === 'ai';

  const getStatusBadge = () => {
    if (mode === 'hr-candidate' || mode === 'hr-recruiter') {
      return {
        text: '1:1 Live HR Video Call',
        bg: 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300',
        dot: 'bg-emerald-400 animate-pulse',
        icon: <Video className="h-3.5 w-3.5 text-emerald-400" />,
      };
    }
    if (mode === 'video-screening') {
      return {
        text: isRecording ? 'Recording Response...' : 'Video Screening Console',
        bg: isRecording ? 'bg-rose-950/80 border-rose-700/60 text-rose-300' : 'bg-slate-900/90 border-slate-700 text-slate-300',
        dot: isRecording ? 'bg-rose-500 animate-ping' : 'bg-brand-500',
        icon: <Camera className="h-3.5 w-3.5 text-rose-400" />,
      };
    }
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
      text: mode === 'mock-practice' ? 'AI Mock Interviewer Ready' : 'AI Proctored Interviewer',
      bg: 'bg-slate-900/90 border-slate-700 text-slate-300',
      dot: 'bg-emerald-500',
      icon: <Sparkles className="h-3.5 w-3.5 text-brand-400" />,
    };
  };

  const status = getStatusBadge();

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const handleScreeningRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      const qId = screeningQuestions[screeningIdx]?.questionId || `q-${screeningIdx}`;
      setRecordedList((prev) => ({
        ...prev,
        [qId]: { duration: recordingTimer || 30, attempts },
      }));
    } else {
      setIsRecording(true);
      setRecordingTimer(0);
    }
  };

  const handleNextScreeningQuestion = () => {
    if (screeningIdx < screeningQuestions.length - 1) {
      setScreeningIdx((prev) => prev + 1);
      setAttempts(1);
      setRecordingTimer(0);
      setIsRecording(false);
    } else if (onSubmitScreening) {
      onSubmitScreening(recordedList);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      {/* Header Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/90 px-4 sm:px-6 flex items-center justify-between z-30 flex-shrink-0 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <CompanyLogo name={companyName} size="md" className="shadow-md flex-shrink-0 border border-slate-700/60" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white truncate font-display">{companyName}</span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full flex items-center gap-1 ${status.bg}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.text} {phase ? `• ${phase}` : ''}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{jobTitle}</p>
          </div>
        </div>

        {/* Right Telemetry & Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {proctorTelemetry && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-400">
              <Eye className="h-3.5 w-3.5 text-emerald-400" />
              <span>Gaze: {proctorTelemetry.gazeCentered ? 'Centered' : 'Away'}</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono font-medium">
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px]">1080p HD</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs font-bold">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>{formatSeconds(mode === 'hr-recruiter' || mode === 'hr-candidate' ? callDuration : timeRemaining)}</span>
          </div>

          {(mode === 'ai-voice' || mode === 'mock-practice') && (
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
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Main Dual-View Body */}
      <main className="flex-1 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 relative z-20 overflow-hidden">
        {/* Left Viewport: Primary Feed (AI Voice Orb OR Remote Video Feed OR Screening Question) */}
        <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-2xl backdrop-blur-md">
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
                  {lastMsg ? lastMsg.content : 'Welcome! The interview session has initialized. Speak clearly into your microphone.'}
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
                  onClick={handleScreeningRecordToggle}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer ${
                    isRecording ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-brand-600 hover:bg-brand-500 text-white'
                  }`}
                >
                  {isRecording ? <PhoneOff className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextScreeningQuestion}
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

        {/* Right Viewport: Candidate Local Camera Feed OR Recruiter Evaluation Form */}
        <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-md flex flex-col">
          {mode === 'hr-recruiter' ? (
            <div className="p-5 flex-1 overflow-y-auto space-y-5 text-sans">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-white font-display flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-brand-400" />
                  Live HR Round Evaluation Form
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Submit evaluation notes and hiring decision for candidate</p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Candidate Notes &amp; Observations</label>
                <textarea
                  value={hrNotes}
                  onChange={(e) => setHrNotes(e.target.value)}
                  placeholder="Record key observations, technical depth, communication clarity..."
                  className="w-full h-32 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none font-sans"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider">HR Round Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHrDecision('pass')}
                    className={`py-3 px-4 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      hrDecision === 'pass' ? 'bg-emerald-950 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Pass HR Round</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHrDecision('fail')}
                    className={`py-3 px-4 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      hrDecision === 'fail' ? 'bg-rose-950 border-rose-500 text-rose-300 ring-2 ring-rose-500/30' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <XCircle className="h-4 w-4 text-rose-400" />
                    <span>Reject Candidate</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={!hrDecision}
                onClick={() => hrDecision && onCompleteHRRound && onCompleteHRRound(hrDecision, hrNotes)}
                className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 font-display"
              >
                <Save className="h-4 w-4" />
                <span>Finalize HR Round Evaluation</span>
              </button>
            </div>
          ) : (
            // Local Candidate Video Feed
            <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
              {camActive && hasCamPermission !== false ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 text-center p-6">
                  <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <VideoOff className="h-8 w-8" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-400">Camera Off</span>
                </div>
              )}

              {/* Local Feed Overlay Badge */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800/80 text-[10px] font-extrabold text-slate-300 flex items-center gap-1.5 backdrop-blur-md">
                <User className="h-3 w-3 text-brand-400" />
                <span>{candidateName} (You)</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Subtitle & Live Transcript Drawer Overlay */}
      {showTranscriptDrawer && (
        <div className="absolute right-4 top-20 bottom-24 w-80 sm:w-96 bg-slate-900/95 border border-slate-800 rounded-3xl p-4 shadow-2xl backdrop-blur-xl z-40 flex flex-col space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-extrabold text-white font-display flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-400" />
              Live Transcript &amp; Dialogue
            </span>
            <button
              type="button"
              onClick={() => setShowTranscriptDrawer(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 py-8 font-medium">No transcript turns logged yet.</div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                    m.role === 'candidate'
                      ? 'bg-brand-950/40 border-brand-800/50 text-brand-200 text-right ml-6'
                      : 'bg-slate-950 border-slate-800 text-slate-200 mr-6'
                  }`}
                >
                  <span className="text-[10px] font-extrabold block text-slate-400 uppercase tracking-wider mb-1">
                    {m.role === 'candidate' ? 'Candidate' : 'AI Interviewer'}
                  </span>
                  {m.content}
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Floating Bottom Control Bar */}
      <footer className="h-20 border-t border-slate-800/80 bg-slate-950 px-4 sm:px-8 flex items-center justify-between z-30 flex-shrink-0 shadow-2xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMicActive(!micActive)}
            className={`p-3.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              micActive ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800' : 'bg-rose-950 border-rose-800 text-rose-300'
            }`}
          >
            {micActive ? <Mic className="h-4 w-4 text-emerald-400" /> : <MicOff className="h-4 w-4 text-rose-400" />}
          </button>

          <button
            type="button"
            onClick={() => setCamActive(!camActive)}
            className={`p-3.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              camActive ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800' : 'bg-rose-950 border-rose-800 text-rose-300'
            }`}
          >
            {camActive ? <Video className="h-4 w-4 text-emerald-400" /> : <VideoOff className="h-4 w-4 text-rose-400" />}
          </button>
        </div>

        {/* Text Fallback Form */}
        {onSubmitAnswer && (
          <form onSubmit={handleTextSubmit} className="hidden sm:flex flex-1 max-w-lg mx-4 items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your response as text fallback..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isAnalyzing}
              className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <PhoneOff className="h-4 w-4" />
          <span>End Session</span>
        </button>
      </footer>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white font-display">Confirm End Session?</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Are you sure you want to finish and submit your interview session?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-2xl border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onEndSession}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md cursor-pointer"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnifiedInterviewConsole;
