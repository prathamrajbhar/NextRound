'use client';

import React from 'react';
import { Award, Sliders, Check, Copy, Download } from '@/lib/lucide-google-icons';
import { ATSResumeData } from '@/types';
import { siteConfig } from '@/lib/config';

interface ResumeStageProps {
  resumeData: ATSResumeData;
  selectedTemplate: 'classic' | 'modern' | 'executive';
  setSelectedTemplate: (val: 'classic' | 'modern' | 'executive') => void;
  copiedText: boolean;
  onCopyResumeText: () => void;
  onRestart: () => void;
}

export function ResumeStage({
  resumeData,
  selectedTemplate,
  setSelectedTemplate,
  copiedText,
  onCopyResumeText,
  onRestart,
}: ResumeStageProps) {
  const getAbsolutePdfUrl = (url?: string) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = siteConfig.apiBaseUrl.replace(/\/api\/v[0-9]+$/, '');
    return `${base}${url}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">ATS Compliance Score</h3>
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

        {/* Template Selector & Toolbar */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Layout Theme
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'classic', label: 'Classic ATS' },
              { id: 'modern', label: 'Modern Minimal' },
              { id: 'executive', label: 'Executive' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id as 'classic' | 'modern' | 'executive')}
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
              {copiedText ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
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

      {/* Right Paper Resume */}
      <div className="lg:col-span-8">
        <div className="rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-8 shadow-xl space-y-6 text-slate-900 dark:text-slate-100 font-sans min-h-[750px]">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-5 text-center space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
              {resumeData.name}
            </h2>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {resumeData.title}
            </p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center justify-center gap-3 flex-wrap">
              <span>{resumeData.location}</span> • <span>{resumeData.email}</span> • <span>{resumeData.phone}</span>
            </p>
            <div className="flex items-center justify-center gap-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
              <span>{resumeData.linkedin}</span>
              <span>•</span>
              <span>{resumeData.github}</span>
              <span>•</span>
              <span>{resumeData.portfolio}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1">
              Professional Summary
            </h3>
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {resumeData.summary}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1">
              Professional Experience
            </h3>
            <div className="space-y-4">
              {resumeData.experience.map((exp, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs md:text-sm font-extrabold">
                    <span className="text-slate-900 dark:text-slate-100">{exp.role} <span className="font-semibold text-emerald-600 dark:text-emerald-400">@ {exp.company}</span></span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">{exp.period} | {exp.location}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {exp.highlights.map((h, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1">
              Featured Technical Projects
            </h3>
            <div className="space-y-3">
              {resumeData.projects.map((proj, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900 dark:text-slate-100">{proj.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">[{proj.techStack.join(', ')}]</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{proj.description}</p>
                  <p className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">Impact: {proj.impact}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1">
              Skills & Technical Competencies
            </h3>
            <div className="space-y-1 text-xs">
              {resumeData.skills.map((s, idx) => (
                <p key={idx}>
                  <strong className="text-slate-900 dark:text-slate-100">{s.category}: </strong>
                  <span className="text-slate-700 dark:text-slate-300">{s.items.join(', ')}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1">
              Education & Credentials
            </h3>
            {resumeData.education.map((edu, idx) => (
              <div key={idx} className="flex justify-between text-xs font-medium">
                <span><strong className="text-slate-900 dark:text-slate-100">{edu.degree}</strong> — {edu.institution}</span>
                <span className="text-slate-500">{edu.year} {edu.gpa && `(GPA: ${edu.gpa})`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
