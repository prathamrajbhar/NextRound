'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Play, Pause, RefreshCw, Activity, ArrowRight, User } from '@/lib/lucide-google-icons';

interface HeroSectionProps {
  hrHref: string;
  candidateHref: string;
  isLoggedIn: boolean;
}

const dialogueSteps = [
  {
    speaker: 'AI Recruiter',
    text: "Hello! Welcome to the HireOS voice screening round. I will ask you a few questions about your technical background. Ready to begin?",
    status: 'Speaking' as const,
    gaze: true,
    faces: 1,
  },
  {
    speaker: 'AI Recruiter',
    text: "Could you explain the main difference between Server and Client Components in Next.js, and when you would use each?",
    status: 'Speaking' as const,
    gaze: true,
    faces: 1,
  },
  {
    speaker: 'Candidate (You)',
    text: "Server Components render on the server, which helps with SEO and page load speed. Client Components are hydrated on the client, which is ideal for interactive elements utilizing React state and hooks.",
    status: 'Listening' as const,
    gaze: true,
    faces: 1,
  },
  {
    speaker: 'System Evaluator',
    text: "Evaluating response against the Next.js technical rubric guidelines...",
    status: 'Analyzing' as const,
    gaze: true,
    faces: 1,
  },
  {
    speaker: 'System Evaluator',
    text: "Analysis Complete. Score: 92/100. Strengths: Clear explanation of rendering benefits. Suggestion: Mention client-side hydration.",
    status: 'Idle' as const,
    gaze: true,
    faces: 1,
  },
];

export function HeroSection({ hrHref, candidateHref, isLoggedIn }: HeroSectionProps) {
  const [simStep, setSimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [typedSubtitle, setTypedSubtitle] = useState('');

  // Autoplay intervals
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      setSimStep((prev) => (prev + 1) % dialogueSteps.length);
    }, 5500);
    return () => clearTimeout(timer);
  }, [simStep, isPlaying]);

  // Subtitles typewriter animation
  useEffect(() => {
    let active = true;
    let i = 0;
    
    // Asynchronously clear state to avoid react-hooks/set-state-in-effect warning
    const timeout = setTimeout(() => {
      if (!active) return;
      setTypedSubtitle('');

      const fullText = dialogueSteps[simStep].text;
      const interval = setInterval(() => {
        if (!active) return;
        setTypedSubtitle(fullText.slice(0, i + 1));
        i++;
        if (i >= fullText.length) {
          clearInterval(interval);
        }
      }, 20);

      return () => clearInterval(interval);
    }, 0);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [simStep]);

  const activeStep = dialogueSteps[simStep];

  return (
    <section className="relative px-4 sm:px-6 pt-12 pb-16 lg:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      {/* Left Columns: Pitch & CTAs */}
      <div className="lg:col-span-7 space-y-6 text-left">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black text-brand-600 dark:text-emerald-400 bg-brand-50/80 dark:bg-emerald-950/30 border border-brand-100 dark:border-emerald-900/40 select-none">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Automated Technical Hiring Platform</span>
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-6xl leading-tight">
          Conversational AI voice <br />
          <span className="bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-emerald-400 dark:to-orange-400 bg-clip-text text-transparent">
            interviews for technical hiring.
          </span>
        </h1>
        
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Automate first-round screening with an AI recruiter that asks technical questions, grades responses against job rubrics, and generates clean candidate scorecards.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href={hrHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand-600/10 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <span>{isLoggedIn ? 'Go to HR Dashboard' : 'Hire Talent (Employers)'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={candidateHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 px-6 py-3.5 text-sm font-extrabold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800/80 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <User className="h-4 w-4" />
            <span>{isLoggedIn ? 'Go to Candidate Dashboard' : 'Practice & Apply (Candidates)'}</span>
          </Link>
        </div>

        {/* Small trust logos / security compliance */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50 flex flex-wrap items-center gap-6 text-slate-400 dark:text-slate-500 select-none">
          <span className="text-[10px] font-black uppercase tracking-wider">Enterprise Compliant</span>
          <div className="flex gap-4 text-xs font-bold font-mono">
            <span>🛡️ SOC-2 Type II</span>
            <span>🔒 HIPAA Compliant</span>
            <span>🇪🇺 GDPR Aligned</span>
          </div>
        </div>
      </div>

      {/* Right Columns: Interactive AI Interview Simulator */}
      <div className="lg:col-span-5">
        <div className="relative rounded-3xl border border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl p-6 overflow-hidden">
          {/* Header Console controls */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-extrabold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                Live Simulation
              </span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-lg bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setSimStep((prev) => (prev + 1) % dialogueSteps.length)}
                className="p-1.5 rounded-lg bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 cursor-pointer"
                title="Next Step"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* AI Voice status Orb & waveform */}
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {/* The Orb */}
            <div className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all duration-550 ${
              activeStep.status === 'Speaking' ? 'bg-gradient-to-tr from-brand-500 to-indigo-500 shadow-lg shadow-brand-500/20 scale-105' :
              activeStep.status === 'Listening' ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20 scale-100' :
              activeStep.status === 'Analyzing' ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 animate-pulse' :
              'bg-slate-200 dark:bg-slate-800'
            }`}>
              <Activity className="h-8 w-8 text-white" />
            </div>

            <div className="text-center">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Agent State
              </span>
              <p className={`text-sm font-extrabold ${
                activeStep.status === 'Speaking' ? 'text-brand-600 dark:text-emerald-400' :
                activeStep.status === 'Listening' ? 'text-emerald-600 dark:text-emerald-400' :
                activeStep.status === 'Analyzing' ? 'text-orange-500' :
                'text-slate-500'
              }`}>
                {activeStep.status}
              </p>
            </div>
          </div>

          {/* Subtitles & Transcriptions */}
          <div className="bg-slate-50/50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-900 rounded-2xl p-4 min-h-[96px] relative">
            <span className="absolute top-2 left-3.5 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {activeStep.speaker}
            </span>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed mt-3.5 font-sans">
              {typedSubtitle}
              <span className="animate-pulse">|</span>
            </p>
          </div>

          {/* Proctoring HUD Metrics */}
          <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-slate-50/30 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Gaze Focus</span>
              <span className={`text-[10px] font-extrabold ${activeStep.gaze ? 'text-emerald-500' : 'text-rose-500'}`}>
                {activeStep.gaze ? '✓ Centered' : '⨯ Off-Screen'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50/30 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Face Detector</span>
              <span className="text-[10px] font-extrabold text-emerald-500">
                {activeStep.faces} Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
