'use client';

import React from 'react';
import { Video, ArrowRight } from '@/lib/lucide-google-icons';
import { SetupHeaderBar } from './SetupHeaderBar';
import { SetupRoleTargetCard } from './SetupRoleTargetCard';
import { SetupSeniorityCard } from './SetupSeniorityCard';
import { SetupMicPrecheckCard } from './SetupMicPrecheckCard';

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
    <div className="relative w-full space-y-6 animate-in fade-in duration-300 font-sans p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800/40 bg-white dark:bg-slate-950 text-slate-800 dark:text-white shadow-xl dark:shadow-2xl overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/5 dark:bg-orange-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-600/5 dark:bg-amber-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"
        style={{ animationDuration: '6s' }}
      />

      <SetupHeaderBar />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start z-10 relative">
        <div className="lg:col-span-8 space-y-6">
          <SetupRoleTargetCard targetRole={targetRole} setTargetRole={setTargetRole} />
          <SetupSeniorityCard
            experienceLevel={experienceLevel}
            setExperienceLevel={setExperienceLevel}
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <SetupMicPrecheckCard />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-900/30 backdrop-blur-md p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 z-10 relative">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="text-xs font-black text-slate-800 dark:text-white">
              Ready to Build Your ATS Resume?
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
              15-Min Dynamic Session
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
            Targeting{' '}
            <strong className="text-orange-600 dark:text-orange-400">{targetRole}</strong> •{' '}
            {experienceLevel}
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
