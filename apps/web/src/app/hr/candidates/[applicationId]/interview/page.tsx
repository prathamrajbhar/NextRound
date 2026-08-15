'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useApplication } from '@/hooks/queries';
import { useAuthContext } from '@/contexts/AuthContext';
import { getScopedStorage } from '@/lib/storage';
import { Application } from '@/types';
import { ChevronRight } from '@/lib/lucide-google-icons';
import { CandidateDetailSkeleton } from '@/components/ui';
import { ErrorState } from '@/components/ui/ErrorState';

export default function HrInterviewReplayPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const { user } = useAuthContext();
  const [mergedApp, setMergedApp] = useState<Application | null>(null);

  const { data: app, isLoading, isError, error, refetch } = useApplication(applicationId);

  useEffect(() => {
    if (!app) return;
    let nextApp = app;
    if (typeof window !== 'undefined') {
      const local = getScopedStorage(user?.id, `candidateInterview_${applicationId}`);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          nextApp = {
            ...app,
            scores:
              parsed.status === 'completed' && typeof parsed.score === 'number'
                ? {
                    composite: parsed.score,
                    technical: parsed.rubric.technical,
                    communication: parsed.rubric.communication,
                    problemSolving: Math.floor(parsed.score * 0.95),
                    experience: Math.floor(parsed.score * 0.92),
                    confidence: Math.floor(parsed.score * 0.98),
                  }
                : app.scores,
            transcript: parsed.transcript || app.transcript,
          };
        } catch (err) {
          console.error('Failed to parse local interview data:', err);
        }
      }
    }
    setMergedApp(nextApp);
  }, [app, applicationId, user?.id]);

  const displayApp = mergedApp;

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-md">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <CandidateDetailSkeleton />;
  }

  if (!displayApp) {
    return <div className="text-center text-xs text-slate-400 p-8">Loading replay...</div>;
  }

  const transcript = Array.isArray(displayApp.transcript) && displayApp.transcript.length > 0
    ? displayApp.transcript
    : null;

  if (!transcript) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="rounded-3xl border border-white/60 bg-white/40 p-8 shadow-md backdrop-blur-md text-center">
          <h2 className="text-lg font-bold text-slate-900 mb-2">No Interview Recording Available</h2>
          <p className="text-sm text-slate-600">This candidate has not completed a voice interview yet.</p>
          <Link href={`/hr/candidates/${applicationId}`} className="inline-block mt-4 text-xs font-bold text-purple-600 hover:underline">
            ← Back to Candidate Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Link href="/hr/dashboard" className="hover:text-purple-600">Overview</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <Link href={`/hr/candidates/${displayApp.id}`} className="hover:text-purple-600">{displayApp.candidateName}</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <span className="text-slate-800">Voice Replay</span>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversation Archive</span>
        <h1 className="text-xl font-extrabold text-slate-900 mt-1">{displayApp.candidateName} Interview Replay</h1>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/40 p-6 md:p-8 shadow-sm backdrop-blur-md space-y-6">
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
                    <span className="text-emerald-705 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{item.score ?? displayApp.scores?.composite ?? '—'}% grade</span>
                  </div>
                  {item.feedback}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
