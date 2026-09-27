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
  const [hasTimedOut, setHasTimedOut] = React.useState(false);

  useEffect(() => {
    if (feedbackData) return;

    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 15;

    const poll = () => {
      attempts++;
      if (attempts < MAX_ATTEMPTS) {
        pollTimer = setTimeout(() => {
          refetch();
          poll();
        }, 3000);
      } else {
        setHasTimedOut(true);
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
    if (hasTimedOut) {
      return (
        <div className="p-8 text-center space-y-4 max-w-md mx-auto rounded-3xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20 backdrop-blur-md animate-in fade-in duration-300">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 text-xl font-black">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Evaluation Processing Delayed
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The AI evaluation service is taking longer than expected. You can retry fetching your results or start another session.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                setHasTimedOut(false);
                refetch();
              }}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Retry Check
            </button>
            <Link
              href="/candidate/mock/new"
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              New Practice
            </Link>
          </div>
        </div>
      );
    }

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

  const isIncomplete = Boolean(feedbackData.isIncomplete) || (feedbackData.overallScore === 0 && (!feedbackData.transcriptHighlights || feedbackData.transcriptHighlights.length === 0));
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
        isIncomplete={isIncomplete}
      />

      {isIncomplete && (
        <div className="p-5 rounded-3xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-200 font-display">
              Incomplete Practice Simulation
            </h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed font-medium">
              This session concluded with 0 candidate responses or code submissions. No AI scorecard or performance metrics could be computed.
            </p>
          </div>
          <Link
            href={`/candidate/mock/new?company=${encodeURIComponent(targetCompany)}&role=${encodeURIComponent(targetRole)}`}
            className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex-shrink-0 shadow-sm transition-all"
          >
            Retake Simulation
          </Link>
        </div>
      )}

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
