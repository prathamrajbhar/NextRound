'use client';

import React from 'react';
import Image from 'next/image';
import { Clock, LinkedinIcon, GithubIcon } from '@/lib/lucide-google-icons';

import { Application } from '@/lib/mockData';

interface CandidateHeaderProps {
  app: Application;
}

export function CandidateHeader({ app }: CandidateHeaderProps) {
  return (
    <>
      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 md:p-7 shadow-md backdrop-blur-md glass-panel flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <Image
            src={app.candidateAvatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
            alt={app.candidateName}
            width={60}
            height={60}
            className="h-15 w-15 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md object-cover flex-shrink-0"
            unoptimized
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
                {app.candidateName}
              </h1>
              <span className="text-[10px] font-extrabold text-brand-600 dark:text-orange-400 bg-brand-50 dark:bg-orange-950/80 border border-brand-200/60 dark:border-orange-900/60 px-2.5 py-0.5 rounded-full uppercase">
                Stage: {app.stage}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{app.candidateEmail}</p>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" /> Applied on {app.appliedDate}
              </span>
              <span>•</span>
              <div className="flex items-center gap-2">
                <a
                  href={`https://linkedin.com/in/${app.candidateName.toLowerCase().replace(/\s+/g, '-')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 border border-blue-200/60 dark:border-blue-900/60 px-2.5 py-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors"
                >
                  <LinkedinIcon className="h-3 w-3" />
                  <span>LinkedIn</span>
                </a>

                <a
                  href={`https://github.com/${app.candidateName.toLowerCase().replace(/\s+/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <GithubIcon className="h-3 w-3" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Composite Readiness Rating */}
        <div className="text-left sm:text-right bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 p-4 rounded-2xl">
          <span className="block text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-display">
            {app.scores?.composite || 86}%
          </span>
          <span className="text-[10px] text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider block mt-0.5">
            Composite AI Rating
          </span>
        </div>
      </div>

      {/* Profile Snapshot Meta Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/45 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 shadow-2xs glass-panel">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Total Experience</span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1 block">5+ Years</span>
        </div>
        <div className="p-4 rounded-2xl bg-white/45 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 shadow-2xs glass-panel">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Location</span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1 block truncate">San Francisco, CA</span>
        </div>
        <div className="p-4 rounded-2xl bg-white/45 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 shadow-2xs glass-panel">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Notice Period</span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">2 Weeks</span>
        </div>
        <div className="p-4 rounded-2xl bg-white/45 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 shadow-2xs glass-panel">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Expected Comp</span>
          <span className="text-sm font-extrabold text-brand-600 dark:text-orange-400 mt-1 block">$165,000/yr</span>
        </div>
      </div>
    </>
  );
}
