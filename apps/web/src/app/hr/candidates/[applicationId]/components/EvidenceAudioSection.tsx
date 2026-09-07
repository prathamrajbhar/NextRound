'use client';

import React from 'react';
import { Mic, Download, AudioLines, Clock } from '@/lib/lucide-google-icons';
import { EvidenceRecording, fmtMs, fmtBytes } from './evidenceReview.types';

interface EvidenceAudioSectionProps {
  audioRecording: EvidenceRecording | null;
}

export function EvidenceAudioSection({ audioRecording }: EvidenceAudioSectionProps) {
  if (!audioRecording) {
    return (
      <div className="p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2">
        <AudioLines className="h-4 w-4 text-slate-400" />
        No audio recording was captured for this session.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <Mic className="h-4 w-4 text-brand-600 dark:text-orange-400" />
        Candidate Audio Recording
      </div>
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-3.5 space-y-2">
        <audio controls preload="metadata" src={audioRecording.url} className="w-full h-10" />
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {fmtMs(audioRecording.duration_ms)}
          </span>
          <span>{fmtBytes(audioRecording.size_bytes)}</span>
          <a
            href={audioRecording.url}
            download
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            <Download className="h-3 w-3" />
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
