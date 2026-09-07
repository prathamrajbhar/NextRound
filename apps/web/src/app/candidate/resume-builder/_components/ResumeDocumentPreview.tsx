'use client';

import React from 'react';
import { ATSResumeData } from '@/types';

interface ResumeDocumentPreviewProps {
  resumeData: ATSResumeData;
}

export function ResumeDocumentPreview({ resumeData }: ResumeDocumentPreviewProps) {
  return (
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
            <span>{resumeData.location}</span> • <span>{resumeData.email}</span> •{' '}
            <span>{resumeData.phone}</span>
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
                  <span className="text-slate-900 dark:text-slate-100">
                    {exp.role}{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      @ {exp.company}
                    </span>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">
                    {exp.period} | {exp.location}
                  </span>
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
                  <span className="text-[10px] text-slate-500 font-mono">
                    [{proj.techStack.join(', ')}]
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">{proj.description}</p>
                <p className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                  Impact: {proj.impact}
                </p>
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
              <span>
                <strong className="text-slate-900 dark:text-slate-100">{edu.degree}</strong> —{' '}
                {edu.institution}
              </span>
              <span className="text-slate-500">
                {edu.year} {edu.gpa && `(GPA: ${edu.gpa})`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
