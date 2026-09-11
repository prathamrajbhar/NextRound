'use client';

import React from 'react';
import { Award, Sliders, Check, Copy, Download } from '@/lib/lucide-google-icons';
import { ATSResumeData } from '@/types';
import { siteConfig } from '@/lib/config';

interface ResumeSidebarProps {
  resumeData: ATSResumeData;
  selectedTemplate: 'classic' | 'modern' | 'executive';
  setSelectedTemplate: (val: 'classic' | 'modern' | 'executive') => void;
  copiedText: boolean;
  onCopyResumeText: () => void;
  onRestart: () => void;
}

export function ResumeSidebar({
  resumeData,
  selectedTemplate,
  setSelectedTemplate,
  copiedText,
  onCopyResumeText,
  onRestart,
}: ResumeSidebarProps) {
  const getAbsolutePdfUrl = (url?: string) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = siteConfig.apiBaseUrl.replace(/\/api\/v[0-9]+$/, '');
    return `${base}${url}`;
  };

  return (
    <div className="lg:col-span-4 space-y-6">
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              ATS Compliance Score
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black">
            {resumeData.atsScore}/100
          </span>
        </div>

        <div className="space-y-3">
          {resumeData.scoreBreakdown.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>{item.label}</span>
                <span className="text-emerald-600 dark:text-emerald-400">{item.score}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${item.score}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Layout Theme
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'classic' as const, label: 'Classic ATS' },
            { id: 'modern' as const, label: 'Modern Minimal' },
            { id: 'executive' as const, label: 'Executive' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                selectedTemplate === t.id
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={onCopyResumeText}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedText ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4 text-slate-500" />
            )}
            {copiedText ? 'Copied Full Resume Text!' : 'Copy Plain Text (ATS)'}
          </button>

          {resumeData.pdfUrl ? (
            <a
              href={getAbsolutePdfUrl(resumeData.pdfUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 text-center"
            >
              <Download className="h-4 w-4" /> Download PDF Resume
            </a>
          ) : (
            <button
              disabled
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-extrabold flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Download className="h-4 w-4" /> PDF Link Unavailable
            </button>
          )}

          <button
            onClick={onRestart}
            className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer text-center"
          >
            Start New Voice Interview
          </button>
        </div>
      </div>
    </div>
  );
}
