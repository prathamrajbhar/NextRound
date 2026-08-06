'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronRight, ShieldCheck, ShieldAlert, Clock } from '@/lib/lucide-google-icons';
import { Application } from '@/types';

interface CandidateCardProps {
  app: Application;
  onSelectCandidate?: (app: Application) => void;
}

export default function CandidateCard({ app, onSelectCandidate }: CandidateCardProps) {
  const hasFlags = app.biasReport && app.biasReport.flaggedPhrases.length > 0;

  const handleClick = () => {
    if (onSelectCandidate) {
      onSelectCandidate(app);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="rounded-2xl border border-white/60 dark:border-slate-800 bg-white/55 dark:bg-slate-900/60 p-4 shadow-sm hover:shadow-md transition-all glass-panel relative group hover:border-brand-300 dark:hover:border-orange-500/50 cursor-pointer select-none"
    >
      {/* Header Info */}
      <div className="flex items-start gap-3">
        <Image
          src={app.candidateAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
          alt={app.candidateName}
          width={36}
          height={36}
          className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs object-cover flex-shrink-0"
          unoptimized
        />
        <div className="min-w-0 flex-1">
          <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block truncate leading-tight group-hover:text-brand-600 dark:group-hover:text-orange-400 transition-colors font-display">
            {app.candidateName}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5 truncate">
            {app.candidateEmail}
          </span>
        </div>

        {/* Composite Score */}
        {app.scores && (
          <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-900/60 flex-shrink-0 shadow-2xs">
            {app.scores.composite}%
          </span>
        )}
      </div>

      {/* Bias Audit Report Badge */}
      {app.biasReport && (
        <div className="mt-3 flex items-center gap-1">
          {hasFlags ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/60 px-2.5 py-0.5 rounded-full shadow-2xs">
              <ShieldAlert className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              Bias Audit: Warning
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/60 px-2.5 py-0.5 rounded-full shadow-2xs">
              <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Bias Audit: Audited
            </span>
          )}
        </div>
      )}

      {/* Scorecard breakdown mini-bars */}
      {app.scores && (
        <div className="mt-3 space-y-2 border-t border-slate-200/60 dark:border-slate-800 pt-3">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[9px] font-bold text-slate-500 dark:text-slate-400">
            {/* Tech */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tech</span>
                <span className="text-slate-900 dark:text-slate-100 font-extrabold">{app.scores.technical}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${app.scores.technical}%` }} />
              </div>
            </div>

            {/* Comm */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Comm</span>
                <span className="text-slate-900 dark:text-slate-100 font-extrabold">{app.scores.communication}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${app.scores.communication}%` }} />
              </div>
            </div>

            {/* Logic */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Logic</span>
                <span className="text-slate-900 dark:text-slate-100 font-extrabold">{app.scores.problemSolving}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${app.scores.problemSolving}%` }} />
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Exp</span>
                <span className="text-slate-900 dark:text-slate-100 font-extrabold">{app.scores.experience}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${app.scores.experience}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applied Time & Action Button */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center text-[10px] font-extrabold">
        <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
          <Clock className="h-3 w-3 text-slate-400" />
          {app.appliedDate}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="text-brand-600 dark:text-orange-400 hover:text-brand-700 dark:hover:text-orange-300 font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          <span>Scoring Report</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
