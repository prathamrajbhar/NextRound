'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Mic, Code, ArrowRight } from '@/lib/lucide-google-icons';

interface JobPrepArenaCardProps {
  orgName: string;
  title: string;
}

export function JobPrepArenaCard({ orgName, title }: JobPrepArenaCardProps) {
  return (
    <div className="rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/40 to-amber-100/20 dark:from-amber-950/30 dark:to-amber-900/10 p-6 shadow-sm backdrop-blur-md glass-panel space-y-4">
      <div>
        <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
          AI Practice & Prep Arena
        </h3>
        <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed mt-1.5">
          Prepare for official rounds using interactive AI mock evaluations matching {orgName}&apos;s rubric.
        </p>
      </div>

      <div className="space-y-3">
        {}
        <div className="p-3.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-brand-600 dark:text-orange-400">
            <Mic className="h-4 w-4" />
            <span className="text-xs font-bold">Voice Interview Practice</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Practice dynamic conversational questions scored by our AI Agent.
          </p>
          <Link
            href={`/candidate/mock/new?company=${encodeURIComponent(orgName)}&role=${encodeURIComponent(title)}&track=technical`}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-bold py-2 text-xs transition-all cursor-pointer shadow-xs"
          >
            <span>Start Mock Session</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {}
        <div className="p-3.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Code className="h-4 w-4" />
            <span className="text-xs font-bold">Coding &amp; MCQ Practice</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Try a simulated online assessment environment with real-time feedback.
          </p>
          <Link
            href={`/candidate/mock/new?company=${encodeURIComponent(orgName)}&role=${encodeURIComponent(title)}&track=coding`}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 dark:bg-amber-600 hover:bg-amber-700 dark:hover:bg-amber-700 text-white font-bold py-2 text-xs transition-all cursor-pointer shadow-xs"
          >
            <span>Launch Practice Test</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
