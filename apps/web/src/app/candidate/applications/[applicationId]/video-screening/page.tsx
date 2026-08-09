'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { AsyncScreening } from '@/types';
import { ChevronRight, Camera, Video, Clock } from 'lucide-react';
import UnifiedInterviewConsole from '@/components/interview/UnifiedInterviewConsole';

export default function CandidateVideoScreeningPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);

  const [screening, setScreening] = useState<AsyncScreening | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    async function fetchScreening() {
      try {
        setLoading(true);
        const res = await apiClient.get<AsyncScreening>(`/candidate/applications/${applicationId}/video-screening`);
        if (res) setScreening(res);
      } catch (err) {
        console.error('Failed to load video screening:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchScreening();
  }, [applicationId]);

  const handleSubmitScreening = async (recordedResponses: Record<string, { duration: number; attempts: number }>) => {
    if (!screening) return;
    setIsCapturing(false);

    const updatedResponses = screening.responses.map((resp) => {
      const rec = recordedResponses[resp.questionId];
      return {
        ...resp,
        durationSeconds: rec?.duration || resp.durationSeconds || 45,
        attempts: rec?.attempts || 1,
      };
    });

    try {
      await apiClient.post(`/candidate/applications/${applicationId}/video-screening/submit`, {
        responses: updatedResponses.map((r) => ({
          questionId: r.questionId,
          questionText: r.questionText,
          durationSeconds: r.durationSeconds,
          attempts: r.attempts,
        })),
      });
    } catch (err) {
      console.error('Failed to submit video screening:', err);
    }

    setScreening({
      ...screening,
      status: 'submitted',
      submittedDate: new Date().toISOString().slice(0, 10),
      responses: updatedResponses,
    });
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'reviewed':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading video screening details...
      </div>
    );
  }

  if (!screening) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Video screening details not found.
      </div>
    );
  }

  // Interactive Screening Capture Console using UnifiedInterviewConsole
  if (isCapturing) {
    return (
      <UnifiedInterviewConsole
        mode="video-screening"
        companyName={screening.orgName || 'Company'}
        jobTitle={screening.jobTitle}
        screeningQuestions={screening.responses.map((r) => ({
          questionId: r.questionId,
          questionText: r.questionText,
          timeLimitSeconds: r.timeLimitSeconds || 60,
        }))}
        onEndSession={() => setIsCapturing(false)}
        onSubmitScreening={handleSubmitScreening}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Link href="/candidate/applications" className="hover:text-indigo-650 transition-colors">Applications</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <Link href={`/candidate/applications/${applicationId}`} className="hover:text-indigo-655 transition-colors">{screening.jobTitle}</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <span className="text-slate-800">One-way Video Screening</span>
      </div>

      {/* Header */}
      <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusPill(screening.status)}`}>
              {screening.status}
            </span>
            {screening.submittedDate && (
              <span className="text-xs text-slate-400 font-medium">Submitted {screening.submittedDate}</span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 font-display mt-1">{screening.jobTitle}</h1>
          <p className="text-xs text-slate-500 font-medium">{screening.orgName}</p>
        </div>

        {screening.status !== 'submitted' && (
          <button
            type="button"
            onClick={() => setIsCapturing(true)}
            className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            <span>Launch Video Screening Studio</span>
          </button>
        )}
      </div>

      {/* Questions & Responses Summary */}
      <div className="rounded-3xl border border-white/60 bg-white/45 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
        <h2 className="text-sm font-bold text-slate-900 font-display">Video Screening Prompts</h2>
        <div className="space-y-3">
          {screening.responses.map((resp, idx) => (
            <div key={resp.questionId} className="p-4 rounded-2xl bg-white/60 border border-slate-200/80 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Question {idx + 1}</span>
                <p className="text-xs font-bold text-slate-800">{resp.questionText}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Max {resp.timeLimitSeconds || 60}s</span>
                  {resp.durationSeconds > 0 && <span className="flex items-center gap-1"><Video className="h-3 w-3" /> Recorded {resp.durationSeconds}s</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
