'use client';

import React, { use, useEffect } from 'react';
import Link from 'next/link';
import { ApplicationDetailSkeleton } from '@/components/ui';
import { useMockFeedback } from '@/hooks/queries';
import type { FeedbackData, QaTranscriptItem } from './components/feedback.types';
import { FeedbackHeaderCard } from './components/FeedbackHeaderCard';
import { FeedbackSummaryCard } from './components/FeedbackSummaryCard';
import { FeedbackBreakdownCard } from './components/FeedbackBreakdownCard';
import { FeedbackAnnotatedQaCard } from './components/FeedbackAnnotatedQaCard';
import { FeedbackTelemetryCard } from './components/FeedbackTelemetryCard';

export default function MockFeedbackPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const { data, isLoading, refetch } = useMockFeedback(sessionId);
  const feedbackData = data as FeedbackData | null | undefined;

  useEffect(() => {
    if (feedbackData) return;

    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 20;

    const poll = () => {
      attempts++;
      if (attempts < MAX_ATTEMPTS) {
        pollTimer = setTimeout(() => {
          refetch();
          poll();
        }, 3000);
      }
    };

    poll();
    return () => {
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [feedbackData, refetch]);

  if (isLoading) {
    return <ApplicationDetailSkeleton />;
  }

  if (!feedbackData) {
    return (
      <div className="p-8 text-center space-y-4 animate-in fade-in duration-300">
        <div className="h-12 w-12 mx-auto rounded-full border-2 border-brand-400 border-t-transparent animate-spin opacity-60" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Calculating Your Results
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          Your session is being evaluated. This usually takes under a minute. The page will update automatically.
        </p>
        <Link
          href="/candidate/mock/new"
          className="inline-block text-xs font-bold text-brand-600 dark:text-orange-400 hover:underline mt-2"
        >
          Start a New Practice Session
        </Link>
      </div>
    );
  }

  const targetCompany = feedbackData.targetCompany || 'Practice Mode';
  const targetRole = feedbackData.targetRole || 'Software Engineering Role';
  const score = feedbackData.overallScore ?? 0;
  const feedback =
    feedbackData.detailedBreakdown?.[0]?.feedback || 'Practice session evaluation complete.';
  const technicalScore = feedbackData.metrics?.['Technical Depth'] ?? 0;
  const commScore = feedbackData.metrics?.['Communication & Tone'] ?? 0;
  const sysScore = feedbackData.metrics?.['System Architecture'] ?? 0;
  const strengths = feedbackData.keyStrengths || [];
  const growthAreas = feedbackData.areasToImprove || [];

  const transcript: QaTranscriptItem[] =
    feedbackData.transcriptHighlights && feedbackData.transcriptHighlights.length > 0
      ? feedbackData.transcriptHighlights.map((t) => ({
          question: t.speaker,
          answer: t.text,
          feedback: t.note,
        }))
      : [];

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      <FeedbackHeaderCard
        targetCompany={targetCompany}
        targetRole={targetRole}
        score={score}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <FeedbackSummaryCard
            feedback={feedback}
            strengths={strengths}
            growthAreas={growthAreas}
          />

          <FeedbackBreakdownCard
            technicalScore={technicalScore}
            commScore={commScore}
            sysScore={sysScore}
          />

          <FeedbackAnnotatedQaCard transcript={transcript} />
        </div>

        <FeedbackTelemetryCard telemetry={feedbackData.telemetry} />
      </div>
    </div>
  );
}
