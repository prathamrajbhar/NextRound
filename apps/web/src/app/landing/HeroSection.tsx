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
    text: "Hello! Welcome to the interview. Can you tell me about a time you had to handle a tight deadline at work?",
    status: 'Speaking' as const,
    audioQuality: 'Good',
    callStatus: 'Connected',
  },
  {
    speaker: 'Candidate (You)',
    text: "In my last role, our main client launch was moved up by a week. I coordinated with our design team to prioritize the essential features and successfully delivered the project on time.",
    status: 'Listening' as const,
    audioQuality: 'Good',
    callStatus: 'Connected',
  },
  {
    speaker: 'AI Recruiter',
    text: "Evaluating your response against the job requirements...",
    status: 'Analyzing' as const,
    audioQuality: 'Analyzing',
    callStatus: 'Connected',
  },
  {
    speaker: 'AI Recruiter',
    text: "Evaluation Complete. Verdict: Recommended. Key strengths: Strong prioritization, clear team coordination, and proactive communication.",
    status: 'Idle' as const,
    audioQuality: 'Excellent',
    callStatus: 'Completed',
  },
];

export function HeroSection({ hrHref, candidateHref, isLoggedIn }: HeroSectionProps) {
  const [simStep, setSimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [typedSubtitle, setTypedSubtitle] = useState('');
  const [callSeconds, setCallSeconds] = useState(12);

  // Call duration counter
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

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

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <section className="relative px-4 sm:px-6 pt-12 pb-16 lg:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <style>{`
        @keyframes ripple {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes equalize {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .animate-ripple-1 { animation: ripple 3s infinite ease-out; }
        .animate-ripple-2 { animation: ripple 3s infinite ease-out 1s; }
        .animate-ripple-3 { animation: ripple 3s infinite ease-out 2s; }
        .animate-equalize-1 { animation: equalize 0.6s infinite ease-in-out; }
        .animate-equalize-2 { animation: equalize 0.8s infinite ease-in-out 0.1s; }
        .animate-equalize-3 { animation: equalize 0.5s infinite ease-in-out 0.2s; }
        .animate-equalize-4 { animation: equalize 0.7s infinite ease-in-out 0.3s; }
        .animate-equalize-5 { animation: equalize 0.9s infinite ease-in-out 0.15s; }
      `}</style>

      {/* Left Columns: Pitch & CTAs */}
      <div className="lg:col-span-7 space-y-6 text-left">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black text-brand-600 dark:text-emerald-400 bg-brand-50/80 dark:bg-emerald-950/30 border border-brand-100 dark:border-emerald-900/40 select-none">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>AI-Powered Voice Screening</span>
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-6xl leading-tight">
          Automate your first-round <br />
          <span className="bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-emerald-400 dark:to-orange-400 bg-clip-text text-transparent">
            candidate calls.
          </span>
        </h1>
        
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed font-medium">
          An AI recruiter that calls and interviews your candidates, asks structured questions, and grades responses. Zero scheduling required.
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
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 px-6 py-3.5 text-sm font-extrabold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <User className="h-4 w-4" />
            <span>{isLoggedIn ? 'Go to Candidate Dashboard' : 'Practice & Apply (Candidates)'}</span>
          </Link>
        </div>

        {/* Small trust logos / security compliance */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50 flex flex-wrap items-center gap-6 text-slate-400 dark:text-slate-500 select-none">
          <span className="text-[10px] font-black uppercase tracking-wider">Enterprise Security</span>
          <div className="flex gap-4 text-xs font-bold font-mono">
            <span>🛡️ SOC-2 Type II</span>
            <span>🔒 Encrypted &amp; Secure</span>
            <span>🇪🇺 GDPR Compliant</span>
          </div>
        </div>
      </div>

      {/* Right Columns: Premium dark HUD voice Call Simulator */}
      <div className="lg:col-span-5">
        <div className="relative rounded-3xl border border-slate-850 bg-slate-950/95 dark:bg-slate-950/80 backdrop-blur-xl shadow-2xl p-6 overflow-hidden text-white shadow-indigo-500/5">
          {/* Subtle backing neon glow */}
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Header Console controls */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-450">
                Voice Call Simulator
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Call Timer duration display */}
              <span className="text-xs font-mono font-extrabold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                {formatTime(callSeconds)}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 cursor-pointer border border-slate-800"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setSimStep((prev) => (prev + 1) % dialogueSteps.length)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 cursor-pointer border border-slate-800"
                  title="Next Step"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* AI Voice status Orb & Ripple waves */}
          <div className="flex flex-col items-center justify-center py-6 space-y-5 relative z-10">
            <div className="relative h-20 w-20 flex items-center justify-center">
              {/* Concentric expanding ripples */}
              {isPlaying && activeStep.status !== 'Idle' && (
                <>
                  <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ripple-1" />
                  <div className="absolute inset-0 rounded-full border border-teal-500/20 animate-ripple-2" />
                  <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ripple-3" />
                </>
              )}

              {/* The Pulse Orb */}
              <div className={`relative h-16 w-16 rounded-full flex items-center justify-center transition-all duration-550 border border-white/10 ${
                activeStep.status === 'Speaking' ? 'bg-gradient-to-tr from-brand-500 to-indigo-500 shadow-lg shadow-indigo-500/30 scale-105' :
                activeStep.status === 'Listening' ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-lg shadow-teal-500/30 scale-100' :
                activeStep.status === 'Analyzing' ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-lg shadow-orange-500/30 animate-pulse' :
                'bg-slate-900 border-slate-800'
              }`}>
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Equalizer frequency bars display */}
            <div className="flex items-end justify-center gap-1 h-5 overflow-hidden">
              <div className={`w-0.75 bg-brand-500 rounded-full ${isPlaying && activeStep.status === 'Speaking' ? 'animate-equalize-1' : 'h-1.5'}`} />
              <div className={`w-0.75 bg-indigo-500 rounded-full ${isPlaying && activeStep.status === 'Listening' ? 'animate-equalize-2' : 'h-1'}`} />
              <div className={`w-0.75 bg-teal-500 rounded-full ${isPlaying && activeStep.status !== 'Idle' ? 'animate-equalize-3' : 'h-2'}`} />
              <div className={`w-0.75 bg-emerald-500 rounded-full ${isPlaying && activeStep.status === 'Speaking' ? 'animate-equalize-4' : 'h-1.5'}`} />
              <div className={`w-0.75 bg-purple-500 rounded-full ${isPlaying && activeStep.status === 'Listening' ? 'animate-equalize-5' : 'h-1'}`} />
            </div>
          </div>

          {/* Subtitles & Transcriptions styled as chat bubbles */}
          <div className="bg-slate-950/70 border border-slate-900 rounded-2xl p-4 min-h-[140px] flex flex-col justify-end space-y-3 relative z-10">
            {/* Show last speaking bubble if candidates/recruiter are conversing */}
            {activeStep.status !== 'Speaking' && simStep > 0 && (
              <div className="self-start max-w-[85%] bg-slate-900 border border-slate-800 rounded-2xl p-3 text-[10.5px] text-slate-350 leading-relaxed">
                <span className="block text-[8px] font-black uppercase text-indigo-400 mb-1">AI Recruiter</span>
                {dialogueSteps[1 - (simStep % 2)].text}
              </div>
            )}

            {/* Main active speech typewriter bubble */}
            <div className={`self-end max-w-[85%] rounded-2xl p-3 text-[10.5px] leading-relaxed transition-all duration-300 ${
              activeStep.speaker.startsWith('AI') || activeStep.speaker.startsWith('System')
                ? 'self-start bg-slate-900 border border-slate-800 text-slate-200'
                : 'self-end bg-brand-600/90 border border-brand-500/40 text-white'
            }`}>
              <span className={`block text-[8px] font-black uppercase mb-1 ${
                activeStep.speaker.startsWith('AI') || activeStep.speaker.startsWith('System')
                  ? 'text-indigo-400'
                  : 'text-white/80'
              }`}>
                {activeStep.speaker}
              </span>
              <p className="font-sans">
                {typedSubtitle}
                {isPlaying && <span className="animate-pulse">|</span>}
              </p>
            </div>
          </div>

          {/* Call HUD stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-slate-900 relative z-10">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-900 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">Audio Quality</span>
              <span className="text-[10px] font-extrabold text-emerald-450">
                {activeStep.audioQuality}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-900 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">Line Connection</span>
              <span className="text-[10px] font-extrabold text-emerald-450">
                {activeStep.callStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
