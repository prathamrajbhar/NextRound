'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CandidateSentimentProfile } from '@/types';
import {
  Activity,
  Mic,
  Brain,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  LayoutDashboard,
  Users2,
  Volume2,
} from '@/lib/lucide-google-icons';
import { useSentimentProfiles } from '@/hooks/queries';
import { AnalyticsGridSkeleton } from '@/components/ui';

export default function SentimentAnalysisPage() {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');

  const { data, isLoading } = useSentimentProfiles();
  const profiles = useMemo(
    () => (Array.isArray(data?.profiles) ? data.profiles : []) as unknown as CandidateSentimentProfile[],
    [data]
  );

  useEffect(() => {
    if (profiles.length > 0 && !selectedCandidateId) {
      setSelectedCandidateId(profiles[0].id);
    }
  }, [profiles, selectedCandidateId]);

  if (isLoading) {
    return <AnalyticsGridSkeleton />;
  }

  const currentProfile = profiles.find(p => p.id === selectedCandidateId) || profiles[0];

  if (!currentProfile) {
    return (
      <div className="text-center py-16 text-xs text-slate-400">
        No completed candidate sessions exist yet with vocal sentiment and stress analysis data.
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-16 animate-in fade-in duration-300">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-400">
        <Link href="/hr/dashboard" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1">
          <LayoutDashboard className="h-3.5 w-3.5" /> HR Console
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        <Link href="/hr/talent-pool" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1">
          <Users2 className="h-3.5 w-3.5" /> Candidates
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        <span className="text-slate-700 dark:text-slate-200 font-bold">Sentiment & Stress Analyser</span>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/90 via-orange-50/20 to-slate-50/50 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-950/90 p-6 md:p-8 shadow-md backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-orange-700 dark:text-orange-300 bg-orange-100/80 dark:bg-orange-950/80 border border-orange-200/80 dark:border-orange-800/80">
              <Activity className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" /> Audio Prosody & Stress Heatmap
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
              Sentiment + Stress Analyser
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Analyzes the interview audio recording for pitch, tone, speech pace, and pause cadences to distinguish genuine technical skill gaps from interview nervousness.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-orange-200 dark:border-orange-800 flex-shrink-0">
              <Image
                src={currentProfile.avatar}
                alt={currentProfile.candidateName}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Select Candidate Session
              </label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer pr-4"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {p.candidateName} ({p.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {!currentProfile.hasAudioAnalysis ? (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-10 shadow-sm text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Mic className="h-6 w-6 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">No Audio Sentiment Analysis Yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {currentProfile.audioUrl
              ? 'This interview audio is still being processed for prosody metrics (tone, pitch, speech pace, pauses, stress, and confidence).'
              : 'This completed session has no audio recording attached, so no audio-derived sentiment metrics can be produced. Replay transcripts remain available in the Interview Replay screen.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Stress Index</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                  (currentProfile.overallStressScore ?? 100) < 30
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                    : (currentProfile.overallStressScore ?? 100) < 60
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200'
                }`}>
                  {(currentProfile.overallStressScore ?? 100) < 30 ? 'Low Stress' : (currentProfile.overallStressScore ?? 100) < 60 ? 'Moderate' : 'High Stress'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{currentProfile.overallStressScore}</span>
                <span className="text-xs text-slate-400 font-semibold">/ 100 max</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${(currentProfile.overallStressScore ?? 100) < 30 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${currentProfile.overallStressScore}%` }}
                />
              </div>
            </div>

            <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Confidence Rating</span>
                <Sparkles className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{currentProfile.confidenceRating}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${currentProfile.confidenceRating}%` }} />
              </div>
            </div>

            <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Speech Articulation</span>
                <Volume2 className="h-4 w-4 text-orange-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{currentProfile.speechClarityScore}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${currentProfile.speechClarityScore}%` }} />
              </div>
            </div>

            <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Avg Pause Cadence</span>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{currentProfile.avgPauseDurationSec}s</span>
                <span className="text-xs text-slate-400 font-semibold">avg</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Optimal response pause window is 0.8s - 1.8s</p>
            </div>
          </div>

          {currentProfile.biomarkers && (
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Brain className="h-4 w-4 text-orange-600 dark:text-orange-400" /> Audio Prosody Biomarkers Engine
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-300">Audio Tone Harmony</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{currentProfile.biomarkers.audioTone.steadyPercent}%</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100">{currentProfile.biomarkers.audioTone.status}</p>
                  <p className="text-[10px] text-slate-400">Micro-tremor frequency: {currentProfile.biomarkers.audioTone.tremorPercent}%</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-300">Speech Velocity (WPM)</span>
                    <span className="text-orange-600 dark:text-orange-400">{currentProfile.biomarkers.speechPace.wpm} WPM</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100">{currentProfile.biomarkers.speechPace.status}</p>
                  <p className="text-[10px] text-slate-400">Target Range: {currentProfile.biomarkers.speechPace.idealRange}</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-300">Pitch Micro-variance</span>
                    <span className="text-blue-600 dark:text-blue-400">{currentProfile.biomarkers.pitchVariation.hzStdDev} Hz</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100">{currentProfile.biomarkers.pitchVariation.status}</p>
                  <p className="text-[10px] text-slate-400">Pitch stability index within normal bounds</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-300">Pause Patterns</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{currentProfile.biomarkers.pausePatterns.pausesPerMin}/min</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100">{currentProfile.biomarkers.pausePatterns.status}</p>
                  <p className="text-[10px] text-slate-400">Long stall pauses (&gt;3s): {currentProfile.biomarkers.pausePatterns.longPauseCount}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Emotional Journey Graph (Timeline)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Timeline of confidence vs stress across consecutive audio segments of the interview.
              </p>
            </div>

            {currentProfile.journeyGraph.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No audio timeline segments available for this session.</p>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-6">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 pb-3">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Confidence Level
                  </span>
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Stress Level
                  </span>
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Hesitation Index
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  {currentProfile.journeyGraph.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-350 dark:hover:border-slate-700 shadow-2xs transition-all space-y-3"
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>{item.timeLabel}</span>
                        <span className={`px-1.5 py-0.5 rounded font-black uppercase text-[8px] ${
                          item.emotionLabel === 'Confident'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                            : item.emotionLabel === 'Hesitant'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800'
                            : item.emotionLabel === 'Neutral'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350 border border-slate-200/80 dark:border-slate-700'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800'
                        }`}>
                          {item.emotionLabel}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">Audio Segment {idx + 1}</p>

                      <div className="space-y-1.5">
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[9px] text-emerald-400 font-bold">
                            <span>Conf</span> <span>{item.confidence}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${item.confidence}%` }} />
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[9px] text-rose-400 font-bold">
                            <span>Stress</span> <span>{item.stress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-400 rounded-full" style={{ width: `${item.stress}%` }} />
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[9px] text-amber-400 font-bold">
                            <span>Hesitation</span> <span>{item.hesitation}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${item.hesitation}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
