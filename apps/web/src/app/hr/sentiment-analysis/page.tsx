'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  Mic,
  Brain,
  ChevronRight,
  LayoutDashboard,
  Users2,
  Clock,
  Sparkles,
} from '@/lib/lucide-google-icons';

export default function SentimentAnalysisPage() {
  return (
    <div className="w-full space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-400">
        <Link href="/hr/dashboard" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1">
          <LayoutDashboard className="h-3.5 w-3.5" /> HR Console
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        <Link href="/hr/talent-pool" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1">
          <Users2 className="h-3.5 w-3.5" /> Candidates
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        <span className="text-slate-700 dark:text-slate-200 font-bold">Sentiment &amp; Stress Analyser</span>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/90 via-orange-50/20 to-slate-50/50 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-950/90 p-6 md:p-8 shadow-md backdrop-blur-md">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-orange-700 dark:text-orange-300 bg-orange-100/80 dark:bg-orange-950/80 border border-orange-200/80 dark:border-orange-800/80">
            <Activity className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" /> Real-time Vocal Biomarkers &amp; Stress Heatmap
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Sentiment + Stress Analyser
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Analyzes audio pitch, tone harmony, speech pace, and pause cadences to distinguish genuine technical skill gaps from interview nervousness.
          </p>
        </div>
      </div>

      {/* Bypass Notice Card */}
      <div className="rounded-3xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 p-8 flex flex-col items-center text-center gap-5 shadow-sm">
        <div className="p-5 rounded-3xl bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800">
          <Mic className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="space-y-2 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 border border-amber-200 dark:border-amber-800 uppercase tracking-wider">
            <Clock className="h-3 w-3" /> Coming Soon
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Audio Prosody &amp; Sentiment ML — In Development
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            This feature requires a dedicated audio ML pipeline using{' '}
            <span className="font-bold text-amber-700 dark:text-amber-300">pyAudioAnalysis</span> or{' '}
            <span className="font-bold text-amber-700 dark:text-amber-300">wav2vec2-large-robust-emotion</span>{' '}
            for real-time prosody extraction, pitch micro-variance analysis, and acoustic stress detection from raw audio waveforms.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bypass Reference:{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono">audio_prosody_ml</code>
            {' '}— see{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono">BYPASS_REGISTRY.md</code>{' '}
            Feature A.
          </p>
        </div>

        {/* Feature Teaser Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-2">
          {[
            { icon: Activity, label: 'Stress Heatmap', desc: 'Real-time stress index per interview stage' },
            { icon: Brain, label: 'Emotional Journey', desc: 'Confidence vs stress timeline graph' },
            { icon: Sparkles, label: 'Vocal Biomarkers', desc: 'Pitch, pace, pause cadence analysis' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2 opacity-60">
              <Icon className="h-5 w-5 text-orange-500" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
