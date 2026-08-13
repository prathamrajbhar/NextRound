'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Cpu, ShieldCheck, ArrowLeftRight } from '@/lib/lucide-google-icons';

export function BentoGrid() {
  const [typedQuery, setTypedQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Typewriter effect for vector search card
  useEffect(() => {
    let active = true;
    let i = 0;
    const queryStr = 'Next.js engineer with WebRTC experience...';
    let interval: NodeJS.Timeout;

    // Asynchronously clear state to avoid react-hooks/set-state-in-effect warning
    const timeout = setTimeout(() => {
      if (!active) return;
      setTypedQuery('');

      if (hoveredCard === 3) {
        interval = setInterval(() => {
          if (!active) return;
          setTypedQuery(queryStr.slice(0, i + 1));
          i++;
          if (i >= queryStr.length) {
            clearInterval(interval);
          }
        }, 45);
      }
    }, 0);

    return () => {
      active = false;
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [hoveredCard]);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-24 w-full text-left">
      <div className="text-center md:text-left mb-12">
        <span className="text-xs font-black text-brand-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
          Platform Features
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          Everything required for production-grade screening
        </h2>
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm max-w-2xl leading-relaxed">
          Standardize technical evaluations, protect audit integrity, and eliminate human bottlenecks in your hiring pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Card 1: Sourcing & Rubrics (Col-Span 7) */}
        <div
          onMouseEnter={() => setHoveredCard(0)}
          onMouseLeave={() => setHoveredCard(null)}
          className="md:col-span-7 rounded-3xl border border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md shadow-xs p-6 flex flex-col justify-between group overflow-hidden transition-all hover:scale-[1.01]"
        >
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-emerald-950/30 flex items-center justify-center text-brand-600 dark:text-emerald-400 border border-brand-100 dark:border-emerald-900/40">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">AI Job Sourcing &amp; Rubrics</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Provide basic parameters and our models generate comprehensive scoring rubrics, technical checklists, and structured questions.
              </p>
            </div>
          </div>

          {/* Interactive Visual: Rubric JSON structure */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-955 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-900 text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 space-y-1 select-none">
            <p className="text-slate-450 dark:text-slate-500">{"{"}</p>
            <p className="pl-4"><span className="text-orange-600 dark:text-orange-400">&quot;jobTitle&quot;</span>: <span className="text-indigo-600 dark:text-teal-355">&quot;Senior Frontend Engineer&quot;</span>,</p>
            <p className="pl-4"><span className="text-orange-600 dark:text-orange-400">&quot;dimensions&quot;</span>: [</p>
            <p className="pl-8">{"{ "}<span className="text-orange-600 dark:text-orange-400">&quot;name&quot;</span>: <span className="text-indigo-600 dark:text-teal-355">&quot;WebRTC Signaling&quot;</span>, <span className="text-orange-600 dark:text-orange-400">&quot;weight&quot;</span>: <span className="text-purple-650 dark:text-purple-300">0.3</span>{" }"},</p>
            <p className="pl-8">{"{ "}<span className="text-orange-600 dark:text-orange-400">&quot;name&quot;</span>: <span className="text-indigo-600 dark:text-teal-355">&quot;React Hydration&quot;</span>, <span className="text-orange-600 dark:text-orange-400">&quot;weight&quot;</span>: <span className="text-purple-650 dark:text-purple-300">0.4</span>{" }"} </p>
            <p className="pl-4">]</p>
            <p className="text-slate-450 dark:text-slate-500">{"}"}</p>
          </div>
        </div>

        {/* Card 2: Proctoring HUD (Col-Span 5) */}
        <div
          onMouseEnter={() => setHoveredCard(1)}
          onMouseLeave={() => setHoveredCard(null)}
          className="md:col-span-5 rounded-3xl border border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md shadow-xs p-6 flex flex-col justify-between group overflow-hidden transition-all hover:scale-[1.01]"
        >
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">Anti-Cheat Proctoring HUD</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Utilize local MediaPipe computer vision constraints to log window switches, multiple face presence, or audio interference patterns.
              </p>
            </div>
          </div>

          {/* Interactive Visual: Live alerts checklist */}
          <div className="mt-6 space-y-2 select-none">
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/85 bg-white/40 dark:bg-slate-950/40">
              <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300">Multiple Faces</span>
              <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                No Anomaly
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/85 bg-white/40 dark:bg-slate-950/40">
              <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300">Tab Switching</span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                hoveredCard === 1 ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'
              }`}>
                {hoveredCard === 1 ? '1 Warning' : 'No Anomaly'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Scorecards (Col-Span 5) */}
        <div
          onMouseEnter={() => setHoveredCard(2)}
          onMouseLeave={() => setHoveredCard(null)}
          className="md:col-span-5 rounded-3xl border border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md shadow-xs p-6 flex flex-col justify-between group overflow-hidden transition-all hover:scale-[1.01]"
        >
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-orange-950/30 flex items-center justify-center text-emerald-650 dark:text-orange-400 border border-emerald-100 dark:border-orange-900/40">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">Unbiased Scorecards</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Receive standardized transcripts and dimension scores. All results trace directly to rubric guidelines to protect objectivity.
              </p>
            </div>
          </div>

          {/* Interactive Visual: Score meters */}
          <div className="mt-6 space-y-2.5 select-none">
            <div>
              <div className="flex justify-between text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                <span>System Architecture</span>
                <span className="text-brand-650 dark:text-orange-405">{hoveredCard === 2 ? '94%' : '88%'}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-955 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-600 dark:bg-orange-500 h-full transition-all duration-700"
                  style={{ width: hoveredCard === 2 ? '94%' : '88%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                <span>Problem Solving</span>
                <span className="text-brand-650 dark:text-orange-405">{hoveredCard === 2 ? '85%' : '80%'}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-955 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-600 dark:bg-orange-500 h-full transition-all duration-700"
                  style={{ width: hoveredCard === 2 ? '85%' : '80%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Vector search talent pool (Col-Span 7) */}
        <div
          onMouseEnter={() => setHoveredCard(3)}
          onMouseLeave={() => setHoveredCard(null)}
          className="md:col-span-7 rounded-3xl border border-white/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md shadow-xs p-6 flex flex-col justify-between group overflow-hidden transition-all hover:scale-[1.01]"
        >
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-650 dark:text-purple-400 border border-purple-150 dark:border-purple-900/40">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">Semantic Talent Search</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Query candidate archives using natural language statements. Powered by pgvector embeddings for instant, query-based candidate match profiles.
              </p>
            </div>
          </div>

          {/* Interactive Visual: Typing search bar */}
          <div className="mt-6 space-y-3 select-none">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/85 bg-white/40 dark:bg-slate-955 text-xs font-mono text-slate-450 dark:text-slate-500 min-h-[38px] relative">
              <span>🔍</span>
              <span>
                {typedQuery || <span className="text-slate-350 dark:text-slate-650">Hover card to search talent pool...</span>}
              </span>
              {hoveredCard === 3 && <span className="animate-pulse">|</span>}
            </div>
            {hoveredCard === 3 && (
              <div className="p-2.5 rounded-xl border border-brand-200 bg-brand-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10 flex items-center justify-between text-[10px] text-brand-700 dark:text-emerald-300 font-extrabold animate-fade-in">
                <span>Matching Candidates Found</span>
                <span className="bg-brand-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md">8 candidates</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
