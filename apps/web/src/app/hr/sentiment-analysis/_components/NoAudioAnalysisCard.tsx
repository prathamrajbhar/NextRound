'use client';

import React from 'react';
import { Mic } from '@/lib/lucide-google-icons';

interface NoAudioAnalysisCardProps {
  hasAudioUrl: boolean;
}

export function NoAudioAnalysisCard({ hasAudioUrl }: NoAudioAnalysisCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-10 shadow-sm text-center space-y-3">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Mic className="h-6 w-6 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
        No Audio Sentiment Analysis Yet
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
        {hasAudioUrl
          ? 'This interview audio is still being processed for prosody metrics (tone, pitch, speech pace, pauses, stress, and confidence).'
          : 'This completed session has no audio recording attached, so no audio-derived sentiment metrics can be produced. Replay transcripts remain available in the Interview Replay screen.'}
      </p>
    </div>
  );
}
