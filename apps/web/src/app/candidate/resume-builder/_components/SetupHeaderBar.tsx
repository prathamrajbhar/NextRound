'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, FileText, ShieldCheck } from '@/lib/lucide-google-icons';

export function SetupHeaderBar() {
  return (
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
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">
              ATS Compatibility
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              98.4% Match Rate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
