'use client';

import React from 'react';
import Image from 'next/image';
import { X, Download, GithubIcon, LinkedinIcon } from '@/lib/lucide-google-icons';
import { Application } from '@/types';

interface CandidateDrawerHeaderProps {
  app: Application;
  onClose: () => void;
  onDownloadResume: () => void;
}

export function CandidateDrawerHeader({
  app,
  onClose,
  onDownloadResume,
}: CandidateDrawerHeaderProps) {
  const linkedinHandle = app.candidateName.toLowerCase().replace(/\s+/g, '-');
  const githubHandle = app.candidateName.toLowerCase().replace(/\s+/g, '');

  return (
    <div className="p-5 md:p-6 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/80 dark:bg-[#0b0f19] flex-shrink-0">
      <div className="flex gap-3.5 items-center min-w-0">
        {app.candidateAvatar ? (
          <Image
            src={app.candidateAvatar}
            alt={app.candidateName}
            width={52}
            height={52}
            className="h-13 w-13 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm object-cover flex-shrink-0"
            unoptimized
          />
        ) : (
          <div className="h-13 w-13 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center bg-brand-50 dark:bg-orange-950/60 text-brand-600 dark:text-orange-400 font-black text-lg flex-shrink-0">
            {(app.candidateName || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white font-display leading-tight truncate">
              {app.candidateName}
            </h2>
            {app.scores && (
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full flex-shrink-0">
                {app.scores.composite}% Match
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">{app.candidateEmail}</p>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
            <span>Stage: <strong className="text-brand-600 dark:text-orange-400 uppercase">{app.stage}</strong></span>
            <span>•</span>
            <a
              href={`https://linkedin.com/in/${linkedinHandle}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 border border-blue-200/60 dark:border-blue-900/60 px-2 py-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors"
            >
              <LinkedinIcon className="h-2.5 w-2.5" />
              <span>LinkedIn</span>
            </a>
            <a
              href={`https://github.com/${githubHandle}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[9px] font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <GithubIcon className="h-2.5 w-2.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onDownloadResume}
          title="Download Candidate Resume PDF"
          className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download Resume</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
