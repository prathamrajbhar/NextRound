'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  LayoutDashboard,
  Users2,
  Volume2,
  Loader2,
} from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';

export default function SentimentAnalysisPage() {
  const [profiles, setProfiles] = useState<CandidateSentimentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    async function loadSentimentProfiles() {
      try {
        setLoading(true);
        const res = await apiClient.get<{ profiles: CandidateSentimentProfile[] }>('/hr/sentiment');
        if (res && Array.isArray(res.profiles)) {
          setProfiles(res.profiles);
          if (res.profiles.length > 0) {
            setSelectedCandidateId(res.profiles[0].id);
          }
        } else {
          setProfiles([]);
        }
      } catch (err) {
        console.error('Failed to fetch sentiment profiles:', err);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    }
    loadSentimentProfiles();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
      </div>
    );
  }

  const currentProfile = profiles.find(p => p.id === selectedCandidateId) || profiles[0];

  if (!currentProfile) {
    return (
      <div className="text-center py-16 text-xs text-slate-400">
        No completed candidate sessions exist yet with vocal sentiment and stress analysis data.
      </div>
    );
  }

  const filteredTranscript = selectedTopic
    ? currentProfile.transcriptWithSentiment.filter(t => t.topic === selectedTopic)
    : currentProfile.transcriptWithSentiment;

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
        <span className="text-slate-700 dark:text-slate-200 font-bold">Sentiment & Stress Analyser</span>
      </div>

      {/* Header Banner & Candidate Selector */}
      <div className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/90 via-orange-50/20 to-slate-50/50 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-950/90 p-6 md:p-8 shadow-md backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-orange-700 dark:text-orange-300 bg-orange-100/80 dark:bg-orange-950/80 border border-orange-200/80 dark:border-orange-800/80">
              <Activity className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" /> Real-time Vocal Biomarkers & Stress Heatmap
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
              Sentiment + Stress Analyser
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Analyzes audio pitch, tone harmony, speech pace, and pause cadences to distinguish genuine technical skill gaps from interview nervousness.
            </p>
          </div>

          {/* Candidate Dropdown Selector */}
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
                onChange={(e) => {
                  setSelectedCandidateId(e.target.value);
                  setSelectedTopic(null);
                }}
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

      {/* Candidate Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Stress Score Card */}
        <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Stress Index</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
              currentProfile.overallStressScore < 30
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                : currentProfile.overallStressScore < 60
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200'
            }`}>
              {currentProfile.overallStressScore < 30 ? 'Low Stress' : currentProfile.overallStressScore < 60 ? 'Moderate' : 'High Stress'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{currentProfile.overallStressScore}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 100 max</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${currentProfile.overallStressScore < 30 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${currentProfile.overallStressScore}%` }}
            />
          </div>
        </div>

        {/* Confidence Rating Card */}
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

        {/* Speech Clarity Card */}
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

        {/* Average Pause Card */}
        <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Avg Pause Cadence</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{currentProfile.avgPauseDurationSec}s</span>
            <span className="text-xs text-slate-400 font-semibold">per turn</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Optimal response pause window is 0.8s - 1.8s</p>
        </div>
      </div>

      {/* Audio Biomarker Breakdown Grid */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Brain className="h-4 w-4 text-orange-600 dark:text-orange-400" /> Real-time Vocal Biomarkers Engine
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Audio Tone */}
          <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Audio Tone Harmony</span>
              <span className="text-emerald-600 dark:text-emerald-400">{currentProfile.biomarkers.audioTone.steadyPercent}%</span>
            </div>
            <p className="text-xs font-black text-slate-900 dark:text-slate-100">{currentProfile.biomarkers.audioTone.status}</p>
            <p className="text-[10px] text-slate-400">Micro-tremor frequency: {currentProfile.biomarkers.audioTone.tremorPercent}%</p>
          </div>

          {/* Speech Pace */}
          <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Speech Velocity (WPM)</span>
              <span className="text-orange-600 dark:text-orange-400">{currentProfile.biomarkers.speechPace.wpm} WPM</span>
            </div>
            <p className="text-xs font-black text-slate-900 dark:text-slate-100">{currentProfile.biomarkers.speechPace.status}</p>
            <p className="text-[10px] text-slate-400">Target Range: {currentProfile.biomarkers.speechPace.idealRange}</p>
          </div>

          {/* Pitch Variation */}
          <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Pitch Micro-variance</span>
              <span className="text-blue-600 dark:text-blue-400">{currentProfile.biomarkers.pitchVariation.hzStdDev} Hz</span>
            </div>
            <p className="text-xs font-black text-slate-900 dark:text-slate-100">{currentProfile.biomarkers.pitchVariation.status}</p>
            <p className="text-[10px] text-slate-400">Pitch stability index within normal bounds</p>
          </div>

          {/* Pause Patterns */}
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

      {/* Emotional Journey Graph Visual Timeline */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Emotional Journey Graph (Timeline)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive timeline mapping confidence vs stress across interview topics. Click any topic to filter transcript.
            </p>
          </div>

          {selectedTopic && (
            <button
              onClick={() => setSelectedTopic(null)}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline self-start sm:self-auto"
            >
              Reset Topic Filter (Showing All)
            </button>
          )}
        </div>

        {/* Visual Heatmap Graph */}
        <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Confidence Level
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Stress Level
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Hesitation Index
            </span>
          </div>

          {/* Timeline Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {currentProfile.journeyGraph.map((item, idx) => {
              const isSelected = selectedTopic === item.topic;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedTopic(isSelected ? null : item.topic)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-950/60 shadow-lg scale-105'
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>{item.time}</span>
                    <span className={`px-1.5 py-0.5 rounded font-black uppercase text-[8px] ${
                      item.emotionLabel === 'Confident' || item.emotionLabel === 'Enthusiastic'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : item.emotionLabel === 'Hesitant'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {item.emotionLabel}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug">{item.topic}</p>

                  <div className="space-y-1.5">
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[9px] text-emerald-400 font-bold">
                        <span>Conf</span> <span>{item.confidence}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${item.confidence}%` }} />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[9px] text-rose-400 font-bold">
                        <span>Stress</span> <span>{item.stress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-400 rounded-full" style={{ width: `${item.stress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Synchronized Transcript & HR AI Evaluation */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Mic className="h-4 w-4 text-orange-600 dark:text-orange-400" /> Synchronized Vocal Transcript & Skill-Gap Evaluator
          </h3>
          {selectedTopic && (
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-[10px] font-black text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900">
              Filtered: {selectedTopic}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {filteredTranscript.map((t) => (
            <div key={t.id} className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                    t.speaker === 'Candidate' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-200'
                  }`}>
                    {t.speaker}
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.topic}</span>
                  <span className="text-[10px] text-slate-400 font-mono">[{t.timestamp}]</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    {t.audioMetrics.pitch} • {t.audioMetrics.pace}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    t.emotion === 'Confident' || t.emotion === 'Enthusiastic'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : t.emotion === 'Hesitant'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {t.emotion}
                  </span>
                </div>
              </div>

              <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* HR AI Assessment Callout */}
              {t.hrInsight && (
                <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                  t.hrInsight.type === 'Nervousness'
                    ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                    : t.hrInsight.type === 'High Mastery'
                    ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                    : 'border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                }`}>
                  <ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-wider">
                      HR Insight: {t.hrInsight.title}
                    </p>
                    <p className="text-xs font-medium leading-relaxed opacity-90">
                      {t.hrInsight.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
