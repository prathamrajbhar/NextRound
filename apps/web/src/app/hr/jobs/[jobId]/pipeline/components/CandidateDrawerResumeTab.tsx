'use client';

import React from 'react';
import { FileText, Download, CheckCircle2 } from '@/lib/lucide-google-icons';
import { Application } from '@/types';

interface CandidateDrawerResumeTabProps {
  app: Application;
  onDownloadResume: () => void;
}

export function CandidateDrawerResumeTab({
  app,
  onDownloadResume,
}: CandidateDrawerResumeTabProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Experience</span>
          <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block">N/A</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Location</span>
          <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block truncate">N/A</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Notice Period</span>
          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">N/A</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Expected Comp</span>
          <span className="text-xs font-extrabold text-brand-600 dark:text-orange-400 mt-0.5 block">N/A</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-slate-900/90 border border-brand-200/60 dark:border-slate-800 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-orange-950/80 text-brand-600 dark:text-orange-400 border border-brand-200 dark:orange-800 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-display">
              {app.candidateName.replace(/\s+/g, '_')}_Resume.pdf
            </h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
              Candidate dossier
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDownloadResume}
          className="px-3.5 py-2 rounded-xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download PDF</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-2xs">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
          Verified Tech Stack &amp; Skills
        </span>
        <div className="flex flex-wrap gap-2">
          {app.skills && app.skills.length > 0 ? (
            app.skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-[11px] font-extrabold flex items-center gap-1 shadow-2xs"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {skill}
              </span>
            ))
          ) : (
            <p className="text-slate-500 dark:text-slate-400 font-medium">No skills are listed for this candidate.</p>
          )}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-2xs">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 dark:border-slate-800 pb-2">
          Work Experience History
        </span>
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {app.workExperience && app.workExperience.length > 0 ? (
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-2 pl-4 space-y-5">
              {app.workExperience.map((exp, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-600 dark:bg-orange-500 ring-4 ring-white dark:ring-[#161f30]" />
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between flex-wrap gap-1 font-extrabold">
                      <span className="text-slate-900 dark:text-slate-100">{exp.role}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{exp.duration}</span>
                    </div>
                    <p className="text-[11px] text-brand-600 dark:text-orange-400 font-bold">{exp.company}</p>
                    {exp.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1">{exp.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 font-medium">Work experience history is not available for this candidate.</p>
          )}
        </div>
      </div>
    </div>
  );
}
