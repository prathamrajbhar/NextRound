'use client';

import React, { useState } from 'react';
import { Cpu, ShieldCheck, Clock } from '@/lib/lucide-google-icons';

export function BentoGrid() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-24 w-full text-left">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <span className="text-xs font-black text-brand-600 dark:text-emerald-450 uppercase tracking-widest block">
          Platform Capabilities
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl tracking-tight leading-tight">
          Everything you need for first-round screening.
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Remove the scheduling bottlenecks. Have candidates complete structured voice interviews on their own time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card 1: Automated Calls */}
        <div
          onMouseEnter={() => setHoveredCard(0)}
          onMouseLeave={() => setHoveredCard(null)}
          className="rounded-3xl border border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md shadow-xs p-6 flex flex-col justify-between group overflow-hidden transition-all hover:scale-[1.01]"
        >
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-55 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-650 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">AI-Powered Calls</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Candidates receive automated voice calls to complete standard screening questions. No calendar links or manual scheduling required.
              </p>
            </div>
          </div>

          {/* Simple Visual */}
          <div className="mt-6 p-4 rounded-2xl bg-white/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-350 space-y-2 select-none">
            <div className="flex justify-between items-center">
              <span className="font-extrabold">Interview Status</span>
              <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">Completed</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-450 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-900">
              <span>Duration: 12 minutes</span>
              <span>Questions: 4 asked</span>
            </div>
          </div>
        </div>

        {/* Card 2: Call Transcripts & Summaries */}
        <div
          onMouseEnter={() => setHoveredCard(1)}
          onMouseLeave={() => setHoveredCard(null)}
          className="rounded-3xl border border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md shadow-xs p-6 flex flex-col justify-between group overflow-hidden transition-all hover:scale-[1.01]"
        >
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">Transcripts &amp; Summaries</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Get instantly generated text transcripts and high-level summaries. Review candidate answers in seconds without listening to hours of audio.
              </p>
            </div>
          </div>

          {/* Simple Visual */}
          <div className="mt-6 p-4 rounded-2xl bg-white/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-350 space-y-2 select-none">
            <span className="font-extrabold block uppercase tracking-wider text-xs text-brand-600 dark:text-emerald-450 mb-1">AI Summary</span>
            <p className="leading-relaxed font-medium text-slate-600 dark:text-slate-400">
              &quot;Candidate demonstrated strong experience in team leadership, project planning, and resolving cross-functional conflicts.&quot;
            </p>
          </div>
        </div>

        {/* Card 3: Standardized Scorecards */}
        <div
          onMouseEnter={() => setHoveredCard(2)}
          onMouseLeave={() => setHoveredCard(null)}
          className="rounded-3xl border border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md shadow-xs p-6 flex flex-col justify-between group overflow-hidden transition-all hover:scale-[1.01]"
        >
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-55 dark:bg-orange-950/30 flex items-center justify-center text-emerald-650 dark:text-orange-400 border border-emerald-100 dark:border-orange-900/40">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">Standardized Scorecards</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Compare candidates objectively based on skills and performance rubrics. Standardized ratings help protect your pipeline from hiring bias.
              </p>
            </div>
          </div>

          {/* Simple Visual */}
          <div className="mt-6 space-y-2.5 select-none">
            <div>
              <div className="flex justify-between text-xs font-extrabold text-slate-500 dark:text-slate-450 mb-1">
                <span>Technical Skills</span>
                <span className="text-brand-600 dark:text-orange-400">{hoveredCard === 2 ? '94%' : '88%'}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-600 dark:bg-orange-500 h-full transition-all duration-700"
                  style={{ width: hoveredCard === 2 ? '94%' : '88%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-extrabold text-slate-500 dark:text-slate-450 mb-1">
                <span>Communication</span>
                <span className="text-brand-600 dark:text-orange-400">{hoveredCard === 2 ? '85%' : '80%'}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-600 dark:bg-orange-500 h-full transition-all duration-700"
                  style={{ width: hoveredCard === 2 ? '85%' : '80%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
