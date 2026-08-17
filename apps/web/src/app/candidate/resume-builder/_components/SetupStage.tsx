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
import { useSafeMediaStream } from '@/hooks/useSafeMediaStream';

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



const SUGGESTED_ROLES = [
  'Senior Full Stack Engineer',
  'AI Product Engineer',
  'Backend Architect',
  'Frontend Lead',
  'DevOps & Infrastructure Lead',
  'Software Engineer',
  'React Developer',
  'Node.js Developer',
  'Python Developer',
  'Java Developer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Product Manager',
  'UI/UX Designer',
  'QA Automation Engineer',
  'Cloud Solutions Architect',
  'Security Engineer',
];

export function SetupStage({
  targetRole,
  setTargetRole,
  experienceLevel,
  setExperienceLevel,
  onStartCall,
}: SetupStageProps) {

  const [micTesting, setMicTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { start } = useSafeMediaStream({
    constraints: { audio: true },
    enabled: micTesting,
  });

  const filteredSuggestions = SUGGESTED_ROLES.filter((r) =>
    r.toLowerCase().includes(targetRole.toLowerCase()) &&
    r.toLowerCase() !== targetRole.toLowerCase()
  );

  useEffect(() => {
    if (!micTesting) return;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let rafId: number | null = null;
    let active = true;

    start()
      .then((stream) => {
        if (!stream || !active) return;
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!analyser || !active) return;
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

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (audioContext) void audioContext.close();
      setAudioLevel(0);
    };
  }, [micTesting, start]);

  return (
    <div className="relative w-full space-y-6 animate-in fade-in duration-300 font-sans p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800/40 bg-white dark:bg-slate-950 text-slate-800 dark:text-white shadow-xl dark:shadow-2xl overflow-hidden">

      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/5 dark:bg-orange-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-600/5 dark:bg-amber-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-4 z-10 relative">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 mb-1.5">
            <Sparkles className="h-3 w-3 text-orange-500 dark:text-orange-400" />
            <span>AI RESUME STUDIO • ADAPTIVE VOICE GENERATOR</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Build Your ATS Resume via Dynamic Voice Q&amp;A
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Our AI interviewer asks dynamic adaptive questions based on your background to extract metrics and build your ATS resume.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/candidate/resumes"
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex items-center gap-2 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm dark:text-slate-200 font-extrabold text-xs"
          >
            <FileText className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            <span>Past Resumes Vault</span>
          </Link>

          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-md flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">ATS Compatibility</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">98.4% Match Rate</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start z-10 relative">

        <div className="lg:col-span-8 space-y-6">

          <div className="relative z-20 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-900/30 backdrop-blur-md p-6 shadow-md space-y-5">
            <h2 className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
              <Target className="h-4.5 w-4.5 text-orange-500 dark:text-orange-400" />
              Target Position &amp; Role Focus
            </h2>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Target Job Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => {
                    setTargetRole(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Enter job position (e.g. Senior Full Stack Engineer)..."
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-950/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-semibold focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-inner"
                />

                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg py-1">
                    {filteredSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setTargetRole(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Popular Positions</span>
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
                          : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-950/70 dark:border-white/5 dark:text-slate-300 dark:hover:bg-slate-900'
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

          <div className="relative z-10 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-900/30 backdrop-blur-md p-6 shadow-md space-y-5">
            <h2 className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
              <Layers className="h-4.5 w-4.5 text-orange-500 dark:text-orange-400" />
              Seniority &amp; Domain Focus
            </h2>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
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
                          ? 'border-orange-500 bg-orange-500/5 dark:bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                          : 'border-slate-200 bg-slate-100 hover:border-slate-350 dark:border-white/5 dark:bg-slate-950/80 dark:hover:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{exp.label}</span>
                        {selected && <CheckCircle2 className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />}
                      </div>
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">{exp.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        <div className="lg:col-span-4 space-y-6">

          <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-900/30 backdrop-blur-md p-6 shadow-md space-y-4">
            {}
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none border-b border-slate-200/80 dark:border-white/5 pb-3">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-white">
                <Mic className={`h-4 w-4 ${micTesting ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                Microphone Pre-Check
              </span>
              <span className={`font-mono font-black ${micTesting ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
                {micTesting ? `${audioLevel}%` : 'Muted'}
              </span>
            </div>

            {}
            <div className="flex gap-1 items-center h-3 px-0.5 my-2">
              {Array.from({ length: 18 }).map((_, index) => {
                const activeBars = Math.round((audioLevel / 100) * 18);
                const isActive = micTesting && index < activeBars;
                let barColor = 'bg-slate-200 dark:bg-slate-800/80';
                if (isActive) {
                  if (index > 14) {
                    barColor = 'bg-rose-500 dark:bg-rose-400';
                  } else if (index > 11) {
                    barColor = 'bg-amber-500 dark:bg-amber-400';
                  } else {
                    barColor = 'bg-emerald-500 dark:bg-emerald-400';
                  }
                }
                return (
                  <div
                    key={index}
                    className={`h-full flex-1 rounded-[1.5px] transition-all duration-75 ${barColor} ${
                      isActive ? 'opacity-100 shadow-[0_0_6px_rgba(16,185,129,0.3)]' : 'opacity-40 dark:opacity-20'
                    }`}
                  />
                );
              })}
            </div>

            {}
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
              {micTesting
                ? audioLevel > 5
                  ? 'Signal detected — your microphone is working.'
                  : 'Listening… speak to test your microphone.'
                : 'Test your microphone hardware before starting the call.'}
            </p>

            {}
            <button
              type="button"
              onClick={() => setMicTesting(!micTesting)}
              className={`w-full py-2.5 px-4 rounded-xl border text-[11px] font-black tracking-wide uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-50 ${
                micTesting
                  ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-350 focus:ring-slate-500'
                  : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:border-emerald-350 focus:ring-emerald-500'
              }`}
            >
              <Mic className="h-3.5 w-3.5" />
              {micTesting ? 'Stop Test' : 'Test Microphone'}
            </button>
          </div>

        </div>

      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-900/30 backdrop-blur-md p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 z-10 relative">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="text-xs font-black text-slate-800 dark:text-white">Ready to Build Your ATS Resume?</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
              15-Min Dynamic Session
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
            Targeting <strong className="text-orange-600 dark:text-orange-400">{targetRole}</strong> • {experienceLevel}
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
