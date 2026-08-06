'use client';

import React from 'react';
import { Sparkles, Target, Video, ArrowRight } from '@/lib/lucide-google-icons';

interface SetupStageProps {
  targetRole: string;
  setTargetRole: (val: string) => void;
  experienceLevel: string;
  setExperienceLevel: (val: string) => void;
  onStartCall: () => void;
}

export function SetupStage({
  targetRole,
  setTargetRole,
  experienceLevel,
  setExperienceLevel,
  onStartCall,
}: SetupStageProps) {
  return (
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
            onClick={onStartCall}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3"
          >
            <Video className="h-5 w-5" /> Start Voice Interview <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
