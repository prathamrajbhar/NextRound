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
  { id: 'Fresher (0-2 Years)', label: 'Fresher / Entry-Level', sub: '0–2 Yrs Exp' },
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

  // Real microphone level monitoring
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let rafId: number | null = null;
    let localStream: MediaStream | null = null;

    if (micTesting) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          localStream = stream;
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
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      setAudioLevel(0);
    };
  }, [micTesting]);

  return (
    <div className="relative w-full space-y-6 animate-in fade-in duration-300 font-sans p-6 sm:p-8 rounded-3xl border border-slate-800/40 bg-slate-950 text-white shadow-2xl overflow-hidden">
      
      {/* Background Ambient Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4 z-10 relative">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold text-orange-400 bg-orange-950/40 border border-orange-900/50 mb-1.5">
            <Sparkles className="h-3 w-3 text-orange-400" />
            <span>AI RESUME STUDIO • ADAPTIVE VOICE GENERATOR</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Build Your ATS Resume via Dynamic Voice Q&amp;A
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Our AI interviewer asks dynamic adaptive questions based on your background to extract metrics and build your ATS resume.
          </p>
        </div>

        {/* Quick Studio Stats & Past Resumes Vault Link */}
        <div className="flex items-center gap-3">
          <Link
            href="/candidate/resumes"
            className="px-3.5 py-2 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex items-center gap-2 hover:bg-slate-850 transition-all cursor-pointer shadow-sm text-slate-200 font-extrabold text-xs"
          >
            <FileText className="h-4 w-4 text-orange-400" />
            <span>Past Resumes Vault</span>
          </Link>

          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase">ATS Compatibility</span>
              <span className="text-xs font-bold text-slate-200">98.4% Match Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Configuration Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start z-10 relative">
        
        {/* Left Side: Setup config forms (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Target Role configuration */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-6 shadow-md space-y-5">
            <h2 className="text-xs font-extrabold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Target className="h-4.5 w-4.5 text-orange-400" />
              Target Position &amp; Role Focus
            </h2>

            {/* Target Job Title Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Target Job Title
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Enter job position (e.g. Senior Full Stack Engineer)..."
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-white/5 bg-slate-950/80 text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-inner"
              />
            </div>

            {/* Position presets */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Popular Positions</span>
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
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-slate-950/70 border border-white/5 text-slate-300 hover:bg-slate-900'
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

          {/* Seniority & Domain configuration */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-6 shadow-md space-y-5">
            <h2 className="text-xs font-extrabold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Layers className="h-4.5 w-4.5 text-orange-400" />
              Seniority &amp; Domain Focus
            </h2>

            {/* Target Experience Level */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Target Experience Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {EXPERIENCE_OPTIONS.map((exp) => {
                  const selected = experienceLevel === exp.id;
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setExperienceLevel(exp.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                        selected
                          ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                          : 'border-white/5 bg-slate-950/80 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-extrabold text-slate-200">{exp.label}</span>
                        {selected && <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" />}
                      </div>
                      <span className="text-[9px] font-semibold text-slate-500">{exp.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Domain focus */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
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
                        ? 'bg-slate-950 border border-orange-500 text-orange-400'
                        : 'bg-slate-950/70 border border-white/5 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Microphone diagnostic tool (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Microfone Pre-check and Diagnostic */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Mic className={`h-4 w-4 ${micTesting ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="text-xs font-extrabold text-white">Microphone Pre-Check</span>
              </div>
              <button
                type="button"
                onClick={() => setMicTesting(!micTesting)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-colors cursor-pointer ${
                  micTesting
                    ? 'border-red-900 bg-red-950/40 text-red-400'
                    : 'border-white/5 bg-slate-950 text-slate-300 hover:bg-slate-900'
                }`}
              >
                {micTesting ? 'Stop' : 'Test Mic'}
              </button>
            </div>

            {/* Visual sound waveform bars */}
            <div className="h-12 rounded-xl bg-slate-950 border border-white/5 px-4 flex items-end gap-[3px] overflow-hidden">
              {[...Array(18)].map((_, i) => {
                const barHeight = micTesting
                  ? Math.min(100, Math.max(10, audioLevel + Math.abs(Math.sin(i * 1.2)) * Math.min(audioLevel * 0.4, 25)))
                  : 12;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-all duration-75 ${
                      micTesting && audioLevel > 5
                        ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                        : 'bg-slate-800'
                    }`}
                    style={{ height: `${barHeight}%` }}
                  />
                );
              })}
            </div>

            <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
              {micTesting
                ? audioLevel > 5
                  ? 'Signal detected — your microphone is working.'
                  : 'Listening… speak to test your microphone.'
                : 'Test your microphone hardware before starting the call.'}
            </p>
          </div>

        </div>

      </div>

      {/* Launcher Action Footer Bar */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 z-10 relative">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="text-xs font-black text-white">Ready to Build Your ATS Resume?</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-950/40 border border-emerald-800 text-emerald-400">
              15-Min Dynamic Session
            </span>
          </div>
          <p className="text-[10.5px] text-slate-400 font-medium">
            Targeting <strong className="text-orange-400">{targetRole}</strong> • {experienceLevel}
          </p>
        </div>

        <button
          type="button"
          onClick={onStartCall}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          <Video className="h-4 w-4" />
          <span>Start Voice Resume Call</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}
