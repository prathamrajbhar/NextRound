'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  FileText,
  Download,
  Copy,
  ChevronRight,
  Award,
  Check,
  Volume2,
  Bot,
  Sliders,
  LayoutDashboard,
  Clock,
  User,
  ShieldCheck,
  Target,
  ArrowRight,
  Eye
} from '@/lib/lucide-google-icons';
import { mockDynamicTurns, mockGeneratedResume, ATSResumeData } from '@/lib/mockData/resumeBuilder';

type Stage = 'setup' | 'interview' | 'resume';

export default function AIResumeBuilderPage() {
  const [stage, setStage] = useState<Stage>('setup');

  // Setup Form
  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Senior (5+ Years)');

  // Production Interview Call State
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);

  const [turnIndex, setTurnIndex] = useState(0);
  const [aiState, setAiState] = useState<'speaking' | 'listening' | 'evaluating'>('speaking');
  const [candidateSpeechText, setCandidateSpeechText] = useState('');
  const [isSimulatingSpeech, setIsSimulatingSpeech] = useState(false);
  const [extractedInsights, setExtractedInsights] = useState<
    { type: string; label: string; value: string }[]
  >([]);

  // Live Extracted Points Drawer Toggle
  const [showInsightsDrawer, setShowInsightsDrawer] = useState(false);

  // Resume State
  const [resumeData, setResumeData] = useState<ATSResumeData>(mockGeneratedResume);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern' | 'executive'>('classic');
  const [copiedText, setCopiedText] = useState(false);

  // Video Ref for Local WebCam Feed
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentTurn = mockDynamicTurns[turnIndex] || mockDynamicTurns[mockDynamicTurns.length - 1];

  // Webcam activation effect during interview stage
  useEffect(() => {
    if (stage !== 'interview' || !camActive) return;

    let localStream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        localStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        // Fallback to avatar if webcam is not available
      });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stage, camActive]);

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, timeRemaining]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = () => {
    setStage('interview');
    setTimeRemaining(900);
    setIsTimerRunning(true);
    setTurnIndex(0);
    setAiState('speaking');
    setExtractedInsights(mockDynamicTurns[0].extractedInsights);

    setTimeout(() => {
      setAiState('listening');
    }, 3000);
  };

  const handleSimulateCandidateAnswer = () => {
    if (isSimulatingSpeech || aiState === 'speaking') return;

    setIsSimulatingSpeech(true);
    setCandidateSpeechText('Speaking response...');

    setTimeout(() => {
      setCandidateSpeechText(currentTurn.simulatedUserAnswer);
      setIsSimulatingSpeech(false);
      setAiState('evaluating');

      if (currentTurn.extractedInsights) {
        setExtractedInsights(prev => [...prev, ...currentTurn.extractedInsights]);
      }

      setTimeout(() => {
        const nextIdx = turnIndex + 1;
        if (nextIdx < mockDynamicTurns.length) {
          setTurnIndex(nextIdx);
          setCandidateSpeechText('');
          setAiState('speaking');
          setTimeout(() => setAiState('listening'), 3200);
        } else {
          handleEndCall();
        }
      }, 1500);
    }, 1800);
  };

  const handleEndCall = () => {
    setIsTimerRunning(false);
    setStage('resume');
  };

  const handleCopyResumeText = () => {
    const fullText = `${resumeData.name}\n${resumeData.title} | ${resumeData.email} | ${resumeData.phone}\n${resumeData.location}\n\nSUMMARY\n${resumeData.summary}\n\nEXPERIENCE\n` +
      resumeData.experience.map(e => `${e.role} - ${e.company} (${e.period})\n` + e.highlights.map(h => `• ${h}`).join('\n')).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between pb-12 animate-in fade-in duration-300">
      
      {/* STAGE 1: SIMPLE SETUP & ROLE SELECTOR */}
      {stage === 'setup' && (
        <div className="max-w-3xl mx-auto space-y-8 py-10 w-full">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> AI Resume Builder
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
              15-Minute Voice Resume Interview
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              Talk naturally with your AI interviewer. No forms to fill. The AI builds a ready-to-use ATS resume based on your spoken answers.
            </p>
          </div>

          {/* Simple Setup Form */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-8 shadow-xl space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Choose Your Target Role
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Job Position
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 p-4 text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Senior Full Stack Engineer">Senior Full Stack Engineer</option>
                  <option value="AI Product Engineer">AI Product Engineer</option>
                  <option value="Backend Architect">Backend Architect</option>
                  <option value="Frontend Lead">Frontend Lead</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 p-4 text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Senior (5+ Years)">Senior (5+ Years)</option>
                  <option value="Mid-Level (2-5 Years)">Mid-Level (2-5 Years)</option>
                  <option value="Staff / Lead (8+ Years)">Staff / Lead (8+ Years)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                onClick={handleStartCall}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3"
              >
                <Video className="h-5 w-5" /> Start Voice Interview <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: REAL VOICE INTERVIEW ROOM */}
      {stage === 'interview' && (
        <div className="relative w-full h-[780px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 text-white shadow-2xl flex flex-col justify-between p-4 md:p-6 select-none">
          
          {/* Top Control Bar */}
          <div className="flex items-center justify-between z-20 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-white">AI Resume Interview</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-emerald-400 bg-emerald-950/80 border border-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold">{targetRole} • {experienceLevel}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInsightsDrawer(!showInsightsDrawer)}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Resume Highlights ({extractedInsights.length})
              </button>

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 font-mono text-xs font-bold text-slate-200">
                <Clock className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span>{formatTimer(timeRemaining)}</span>
              </div>
            </div>
          </div>

          {/* Main 2-Tile Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-auto h-[560px] relative z-10">
            
            {/* Left Tile: AI Interviewer */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden flex flex-col items-center justify-center p-6 space-y-6 shadow-inner">
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-bold text-slate-300">
                <span className={`h-2 w-2 rounded-full ${aiState === 'speaking' ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                {aiState === 'speaking' ? 'AI Speaking...' : aiState === 'evaluating' ? 'Thinking...' : 'AI Listening...'}
              </div>

              {/* Glowing AI Orb */}
              <div className="relative flex items-center justify-center">
                <div className={`h-36 w-36 rounded-full bg-emerald-500/10 flex items-center justify-center transition-all duration-500 ${
                  aiState === 'speaking' ? 'scale-110 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : ''
                }`}>
                  <div className="h-28 w-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl">
                    <Bot className={`h-12 w-12 ${aiState === 'speaking' ? 'animate-bounce' : ''}`} />
                  </div>
                </div>
              </div>

              {/* AI Spoken Question Box */}
              <div className="max-w-md text-center p-4 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-md">
                <p className="text-sm font-bold text-slate-100 leading-relaxed">
                  "{currentTurn.aiMessage}"
                </p>
              </div>

              {/* Audio Output Spectrum */}
              <div className="flex items-center gap-1.5 h-6">
                {[30, 60, 90, 45, 80, 100, 50, 70, 40, 85, 65].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      aiState === 'speaking' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-800'
                    }`}
                    style={{ height: aiState === 'speaking' ? `${Math.max(20, h * Math.random() + 20)}%` : '25%' }}
                  />
                ))}
              </div>
            </div>

            {/* Right Tile: Candidate Video Feed */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden flex flex-col justify-between p-4 shadow-inner">
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-bold text-slate-300">
                  <span className={`h-2 w-2 rounded-full ${micActive ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  {isSimulatingSpeech ? 'Candidate Speaking...' : 'Mic Active'}
                </div>
              </div>

              {/* Video Feed */}
              <div className="relative h-full w-full my-2 flex items-center justify-center overflow-hidden rounded-xl bg-slate-950">
                {camActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-20 w-20 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                      <User className="h-10 w-10" />
                    </div>
                    <span className="text-xs text-slate-500 font-bold">Camera Off</span>
                  </div>
                )}

                {candidateSpeechText && (
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md text-xs font-medium text-slate-200">
                    "{candidateSpeechText}"
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-mono">
                <span>Vocal Stream Connected</span>
                <div className="flex items-center gap-1 h-4">
                  {[20, 50, 80, 40, 90, 60].map((h, idx) => (
                    <div
                      key={idx}
                      className={`w-1 rounded-full ${isSimulatingSpeech ? 'bg-orange-400 animate-pulse' : 'bg-slate-700'}`}
                      style={{ height: isSimulatingSpeech ? `${h}%` : '30%' }}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Dock */}
          <div className="flex items-center justify-between z-20 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMicActive(!micActive)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  micActive
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                }`}
                title={micActive ? 'Mute Mic' : 'Unmute Mic'}
              >
                {micActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>

              <button
                onClick={() => setCamActive(!camActive)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  camActive
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                }`}
                title={camActive ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {camActive ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>
            </div>

            <button
              onClick={handleSimulateCandidateAnswer}
              disabled={isSimulatingSpeech || aiState === 'speaking'}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2"
            >
              <Mic className={`h-4 w-4 ${isSimulatingSpeech ? 'animate-bounce text-rose-400' : ''}`} />
              {isSimulatingSpeech ? 'Speaking Answer...' : 'Simulate Voice Answer'}
            </button>

            <button
              onClick={handleEndCall}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <PhoneOff className="h-4 w-4" /> Finish & Build Resume
            </button>
          </div>

          {/* Insights Overlay */}
          {showInsightsDrawer && (
            <div className="absolute top-16 right-6 bottom-20 w-80 rounded-2xl bg-slate-900/95 border border-slate-800 backdrop-blur-xl p-4 shadow-2xl z-30 space-y-4 animate-in slide-in-from-right-4 duration-200 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-400" /> Extracted Highlights
                </span>
                <button
                  onClick={() => setShowInsightsDrawer(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close ✕
                </button>
              </div>

              <div className="space-y-2">
                {extractedInsights.map((ins, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-0.5">
                    <div className="flex justify-between text-[9px] font-black uppercase text-emerald-400">
                      <span>{ins.type}</span>
                      <span>{ins.label}</span>
                    </div>
                    <p className="font-bold text-slate-200">{ins.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: ATS RESUME STUDIO RESULT */}
      {stage === 'resume' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">ATS Compliance Score</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black">
                  {resumeData.atsScore}/100
                </span>
              </div>

              <div className="space-y-3">
                {resumeData.scoreBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{item.label}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{item.score}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Selector & Toolbar */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Layout Theme
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'classic', label: 'Classic ATS' },
                  { id: 'modern', label: 'Modern Minimal' },
                  { id: 'executive', label: 'Executive' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      selectedTemplate === t.id
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={handleCopyResumeText}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedText ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                  {copiedText ? 'Copied Full Resume Text!' : 'Copy Plain Text (ATS)'}
                </button>

                <button
                  onClick={() => alert('Downloading official ATS PDF Resume file...')}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <Download className="h-4 w-4" /> Download PDF Resume
                </button>

                <button
                  onClick={() => setStage('setup')}
                  className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer text-center"
                >
                  Start New Voice Interview
                </button>
              </div>
            </div>
          </div>

          {/* Right Paper Resume */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-8 shadow-xl space-y-6 text-slate-900 dark:text-slate-100 font-sans min-h-[750px]">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-5 text-center space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                  {resumeData.name}
                </h2>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {resumeData.title}
                </p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center justify-center gap-3 flex-wrap">
                  <span>{resumeData.location}</span> • <span>{resumeData.email}</span> • <span>{resumeData.phone}</span>
                </p>
                <div className="flex items-center justify-center gap-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
                  <span>{resumeData.linkedin}</span>
                  <span>•</span>
                  <span>{resumeData.github}</span>
                  <span>•</span>
                  <span>{resumeData.portfolio}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1">
                  Professional Summary
                </h3>
                <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {resumeData.summary}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1">
                  Professional Experience
                </h3>
                <div className="space-y-4">
                  {resumeData.experience.map((exp, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs md:text-sm font-extrabold">
                        <span className="text-slate-900 dark:text-slate-100">{exp.role} <span className="font-semibold text-emerald-600 dark:text-emerald-400">@ {exp.company}</span></span>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">{exp.period} | {exp.location}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        {exp.highlights.map((h, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1">
                  Featured Technical Projects
                </h3>
                <div className="space-y-3">
                  {resumeData.projects.map((proj, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900 dark:text-slate-100">{proj.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">[{proj.techStack.join(', ')}]</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{proj.description}</p>
                      <p className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">Impact: {proj.impact}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1">
                  Skills & Technical Competencies
                </h3>
                <div className="space-y-1 text-xs">
                  {resumeData.skills.map((s, idx) => (
                    <p key={idx}>
                      <strong className="text-slate-900 dark:text-slate-100">{s.category}: </strong>
                      <span className="text-slate-700 dark:text-slate-300">{s.items.join(', ')}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1">
                  Education & Credentials
                </h3>
                {resumeData.education.map((edu, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-medium">
                    <span><strong className="text-slate-900 dark:text-slate-100">{edu.degree}</strong> — {edu.institution}</span>
                    <span className="text-slate-500">{edu.year} {edu.gpa && `(GPA: ${edu.gpa})`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
