'use client';

import React, { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { Application } from '@/types';
import { ChevronRight, Play, Pause, Download, Loader2 } from '@/lib/lucide-google-icons';

export default function HrInterviewReplayPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const currentTime = '02:40';
  const progress = 30; // percentage

  useEffect(() => {
    async function fetchReplay() {
      try {
        setLoading(true);
        const data = await apiClient.get<Application>(`/applications/${applicationId}`).catch(() => null);
        if (data) {
          let nextApp = data;
          if (typeof window !== 'undefined') {
            const local = localStorage.getItem(`candidateInterview_${applicationId}`);
            if (local) {
              try {
                const parsed = JSON.parse(local);
                nextApp = {
                  ...data,
                  scores: parsed.rubric ? {
                    composite: parsed.score,
                    technical: parsed.rubric.technical,
                    communication: parsed.rubric.communication,
                    problemSolving: Math.floor(parsed.score * 0.95),
                    experience: Math.floor(parsed.score * 0.92),
                    confidence: Math.floor(parsed.score * 0.98),
                  } : data.scores,
                  transcript: parsed.transcript || data.transcript,
                };
              } catch {}
            }
          }
          setApp(nextApp);
        }
      } catch (err) {
        console.error('Failed to load application replay:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReplay();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!app) {
    return <div className="text-center text-xs text-slate-400 p-8">Loading replay...</div>;
  }

  const transcript = app.transcript || [
    {
      question: 'Explain how Next.js App Router leverages React Server Components to reduce client-side bundle sizes.',
      answer: 'React Server Components execute solely on the server. The output is streamed as a JSON-like protocol rather than raw HTML or full JS chunks.',
      score: 90,
      feedback: 'Accurate description of Server Component serialization and dependency isolation.'
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Link href="/hr/dashboard" className="hover:text-purple-600">Overview</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <Link href={`/hr/candidates/${app.id}`} className="hover:text-purple-600">{app.candidateName}</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <span className="text-slate-800">Voice Replay</span>
      </div>

      {/* Header */}
      <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audio Archive Room</span>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1">{app.candidateName} Interview Replay</h1>
        </div>
        <button className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 border border-slate-200 bg-white/40 px-4 py-2 rounded-full cursor-pointer">
          <Download className="h-4 w-4" /> Download Audio MP3
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Audio Card */}
        <div className="rounded-3xl border border-white/60 bg-white/40 p-6 shadow-md backdrop-blur-md space-y-6">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Audio Controller</h3>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setIsPlaying(!isPlaying)} className="h-12 w-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg cursor-pointer">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Interview Recording</span>
              <span className="text-[10px] text-slate-400 font-semibold block">{currentTime} / 18:00 mins</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 h-10 w-full bg-slate-100/50 p-2 rounded-xl relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-purple-100/50" style={{ width: `${progress}%` }}></div>
            {[2, 3, 4, 3, 2, 4, 6, 8, 4, 2, 3, 5, 7, 5, 3, 2, 4, 6, 5, 3, 2, 1, 3, 4, 2].map((h, idx) => (
              <span key={idx} className="flex-1 bg-purple-400/80 rounded-full" style={{ height: `${h * 4}px` }}></span>
            ))}
          </div>
        </div>

        {/* Transcripts */}
        <div className="lg:col-span-2 rounded-3xl border border-white/60 bg-white/40 p-6 md:p-8 shadow-sm backdrop-blur-md space-y-6">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Conversation Log</h3>
          <div className="space-y-6">
            {transcript.map((item, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex gap-3">
                  <span className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">AI</span>
                  <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl rounded-tl-none text-xs text-slate-800 max-w-[85%] leading-relaxed font-semibold">{item.question}</div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-purple-50 border border-purple-150 p-3 rounded-2xl rounded-tr-none text-xs text-slate-700 max-w-[85%] leading-relaxed font-medium">{item.answer}</div>
                  <span className="h-7 w-7 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">C</span>
                </div>
                <div className="pl-10 pr-10 flex gap-2">
                  <div className="bg-emerald-50/40 border border-emerald-100/50 p-3 rounded-2xl text-[11px] text-slate-500 font-semibold leading-relaxed w-full">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-slate-850">Evaluator Score Annotation</span>
                      <span className="text-emerald-705 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{item.score || app.scores?.composite || 85}% grade</span>
                    </div>
                    {item.feedback}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
