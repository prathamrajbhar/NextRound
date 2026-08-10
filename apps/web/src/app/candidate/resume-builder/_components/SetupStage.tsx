'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Target,
  Video,
  ArrowRight,
  CheckCircle2,
  Mic,
  FileText,
  Check,
  ShieldCheck,
  Layers,
  Zap,
} from '@/lib/lucide-google-icons';

interface SetupStageProps {
  targetRole: string;
  setTargetRole: (val: string) => void;
  experienceLevel: string;
  setExperienceLevel: (val: string) => void;
  onStartCall: () => void;
}

const PRESET_ROLES = [
  'Senior Full Stack Engineer',
  'AI Product Engineer',
  'Backend Architect',
  'Frontend Lead',
  'DevOps & Infrastructure Lead',
];

const EXPERIENCE_OPTIONS = [
  { id: 'Mid-Level (2-5 Years)', label: 'Mid-Level', sub: '2–5 Yrs Exp' },
  { id: 'Senior (5+ Years)', label: 'Senior Specialist', sub: '5–8 Yrs Exp' },
  { id: 'Staff / Lead (8+ Years)', label: 'Staff / Tech Lead', sub: '8+ Yrs Exp' },
];

const INDUSTRY_DOMAINS = ['SaaS & Enterprise', 'AI & Machine Learning', 'FinTech & Trading', 'Cloud Infrastructure'];

export function SetupStage({
  targetRole,
  setTargetRole,
  experienceLevel,
  setExperienceLevel,
  onStartCall,
}: SetupStageProps) {
  const [selectedIndustry, setSelectedIndustry] = useState('SaaS & Enterprise');
  const [micTesting, setMicTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Real microphone level monitoring (no fake random values)
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let rafId: number | null = null;

    if (micTesting) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          audioContext = new AudioContext();
          analyser = audioContext.createAnalyser();
          microphone = audioContext.createMediaStreamSource(stream);
          microphone.connect(analyser);
          analyser.fftSize = 256;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateLevel = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            setAudioLevel(Math.floor((average / 255) * 100));
            rafId = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        })
        .catch((err) => {
          console.error('Microphone access failed:', err);
          setAudioLevel(0);
        });
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (microphone) microphone.disconnect();
      if (audioContext) audioContext.close();
      setAudioLevel(0);
    };
  }, [micTesting]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 font-sans pb-4">
      
      {/* SaaS Top Studio Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold text-brand-600 dark:text-orange-400 bg-brand-50 dark:bg-orange-950/80 border border-brand-200/60 dark:border-orange-900/60 mb-1.5">
            <Sparkles className="h-3 w-3 text-brand-500 dark:text-orange-400" />
            <span>AI RESUME STUDIO • ADAPTIVE VOICE GENERATOR</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Build Your ATS Resume via Dynamic Voice Q&amp;A
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Our AI interviewer asks dynamic adaptive questions based on your background to extract metrics and build your ATS resume.
          </p>
        </div>

        {/* Quick Studio Stats & Past Resumes Vault Link */}
        <div className="flex items-center gap-3">
          <Link
            href="/candidate/resumes"
            className="px-3.5 py-2 rounded-2xl bg-white/60 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-md glass-panel flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm text-slate-800 dark:text-slate-200 font-extrabold text-xs"
          >
            <FileText className="h-4 w-4 text-brand-500 dark:text-orange-400" />
            <span>Past Resumes Vault</span>
          </Link>

          <div className="px-3.5 py-1.5 rounded-2xl bg-white/40 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 backdrop-blur-md glass-panel flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase">ATS Compatibility</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">98.4% Match Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main SaaS Workspace Grid (3 Cols, Full-Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Target Role & Experience Configuration (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Target Role Card */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <Target className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
              Target Position &amp; Role Focus
            </h2>

            {/* Target Job Position Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Target Job Title
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Enter job position (e.g. Senior Full Stack Engineer)..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
              />
            </div>

            {/* Quick Position Preset Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Popular Positions</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_ROLES.map((role) => {
                  const isSelected = targetRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-brand-600 dark:bg-orange-600 text-white shadow-sm'
                          : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Seniority & Industry Focus Card */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <Layers className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
              Seniority &amp; Domain Focus
            </h2>

            {/* Seniority Cards */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Target Experience Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {EXPERIENCE_OPTIONS.map((exp) => {
                  const selected = experienceLevel === exp.id;
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setExperienceLevel(exp.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                        selected
                          ? 'border-brand-500 dark:border-orange-500 bg-brand-500/10 dark:bg-orange-500/10 ring-2 ring-brand-500/30'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{exp.label}</span>
                        {selected && <CheckCircle2 className="h-4 w-4 text-brand-500 dark:text-orange-400" />}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{exp.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Domain Focus */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Domain Industry Focus
              </label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_DOMAINS.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => setSelectedIndustry(domain)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      selectedIndustry === domain
                        ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-sm'
                        : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Dynamic AI Capabilities & Hardware Diagnostic (1 Col) */}
        <div className="space-y-6">
          
          {/* Dynamic AI Adaptive Engine Card */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-brand-500 dark:text-orange-400" />
              Dynamic AI Voice Engine
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-brand-500 dark:text-orange-400" />
                  Real-time Adaptive Q&amp;A
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Questions are generated dynamically in real-time based on your spoken project details and answers.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-emerald-500" />
                  Live Resume Extraction
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Technical skills, scale metrics, and achievements are automatically structured into bullet points.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
                  Instant ATS PDF Export
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  On completion, download a fully formatted, ATS-compliant PDF resume ready for job applications.
                </p>
              </div>
            </div>
          </div>

          {/* Audio Pre-Check Diagnostic */}
          <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Microphone Pre-Check</span>
              </div>
              <button
                type="button"
                onClick={() => setMicTesting(!micTesting)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
              >
                {micTesting ? 'Stop Test' : 'Test Mic'}
              </button>
            </div>

            {/* Equalizer Bar */}
            <div className="h-8 rounded-xl bg-slate-900 dark:bg-slate-950 px-3 flex items-center gap-1 border border-slate-800">
              {[...Array(14)].map((_, i) => {
                const barHeight = micTesting ? Math.min(100, Math.max(15, audioLevel + Math.sin(i) * 30)) : 10;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-emerald-500 to-orange-400 rounded-full transition-all duration-100"
                    style={{ height: `${barHeight}%` }}
                  />
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {micTesting ? '🎤 Microphone active! Speak naturally.' : 'Verify audio clarity before starting session.'}
            </p>
          </div>

        </div>

      </div>

      {/* SaaS Launch Action Banner (Full-Width) */}
      <div className="rounded-3xl border border-brand-200/60 dark:border-orange-900/60 bg-gradient-to-r from-brand-500/10 via-amber-500/10 to-orange-500/10 p-6 shadow-lg backdrop-blur-md glass-panel flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">Ready to Build Your ATS Resume?</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400">
              15-Min Dynamic Session
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Targeting <strong className="text-brand-600 dark:text-orange-400">{targetRole}</strong> • {experienceLevel}
          </p>
        </div>

        <button
          type="button"
          onClick={onStartCall}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white text-xs font-extrabold shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5"
        >
          <Video className="h-4.5 w-4.5" />
          <span>Start Voice Resume Call</span>
          <ArrowRight className="h-4.5 w-4.5" />
        </button>
      </div>

    </div>
  );
}
