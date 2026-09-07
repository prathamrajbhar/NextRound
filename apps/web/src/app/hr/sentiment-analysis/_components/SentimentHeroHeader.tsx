'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, ChevronRight, Users2, Activity } from '@/lib/lucide-google-icons';
import { CandidateSentimentProfile } from '@/types';

interface SentimentHeroHeaderProps {
  currentProfile: CandidateSentimentProfile;
  profiles: CandidateSentimentProfile[];
  selectedCandidateId: string;
  onSelectCandidate: (id: string) => void;
}

export function SentimentHeroHeader({
  currentProfile,
  profiles,
  selectedCandidateId,
  onSelectCandidate,
}: SentimentHeroHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-400">
        <Link
          href="/hr/dashboard"
          className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1"
        >
          <LayoutDashboard className="h-3.5 w-3.5" /> HR Console
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        <Link
          href="/hr/talent-pool"
          className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1"
        >
          <Users2 className="h-3.5 w-3.5" /> Candidates
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
        <span className="text-slate-700 dark:text-slate-200 font-bold">Sentiment &amp; Stress Analyser</span>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/90 via-orange-50/20 to-slate-50/50 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-950/90 p-6 md:p-8 shadow-md backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-orange-700 dark:text-orange-300 bg-orange-100/80 dark:bg-orange-950/80 border border-orange-200/80 dark:border-orange-800/80">
              <Activity className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" /> Audio Prosody &amp; Stress Heatmap
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
                onChange={(e) => onSelectCandidate(e.target.value)}
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
    </div>
  );
}
