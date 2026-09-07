'use client';

import React from 'react';
import { FileText, Download, CheckCircle2 } from '@/lib/lucide-google-icons';
import { Application } from '@/types';

interface CandidateDossierCardProps {
  app: Application;
  onDownloadResume: () => void;
}

export function CandidateDossierCard({ app, onDownloadResume }: CandidateDossierCardProps) {
  return (
    <div className="space-y-6">
      <div className="p-5 rounded-3xl bg-brand-50/50 dark:bg-slate-900/90 border border-brand-200/60 dark:border-slate-800 flex items-center justify-between shadow-2xs backdrop-blur-md glass-panel">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-brand-100 dark:bg-orange-950/80 text-brand-600 dark:text-orange-400 border border-brand-200 dark:border-orange-800 flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
              {app.candidateName.replace(/\s+/g, '_')}_Resume.pdf
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
              Candidate Resume PDF
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDownloadResume}
          className="px-4 py-2.5 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Download className="h-4 w-4" />
          <span>Download PDF</span>
        </button>
      </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-3">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 dark:border-slate-800 pb-2">
          Verified Tech Stack &amp; Skill Competencies
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          {(app.skills || []).map((skill: string, idx: number) => (
            <span
              key={idx}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2.5 font-display">
          Work Experience History
        </h3>
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {app.workExperience && app.workExperience.length > 0 ? (
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-2 pl-4 space-y-5">
              {app.workExperience.map((exp, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-600 dark:bg-orange-500 ring-4 ring-white dark:ring-slate-900" />
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between flex-wrap gap-1 font-extrabold">
                      <span className="text-slate-900 dark:text-slate-100">{exp.role}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {exp.duration}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-600 dark:text-orange-400 font-bold">{exp.company}</p>
                    {exp.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Work experience history is not available for this candidate.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
