'use client';

import React, { useRef } from 'react';
import { FileUp, Check, Link } from '@/lib/lucide-google-icons';
import { GithubIcon, LinkedinIcon } from '@/lib/lucide-google-icons';
import { OnboardingStepProps } from './useCandidateOnboarding';
import { inputCls, labelCls } from './CandidateOnboardingShell';

export function ResumeLinksStep({ form, update }: OnboardingStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) update('resumeFile', file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleFile} />

      {form.resumeFile ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-300">
            <Check className="h-4 w-4" />
            <span className="truncate max-w-xs">{form.resumeFile.name}</span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] font-bold text-emerald-300/80 hover:text-emerald-200 underline cursor-pointer"
          >
            Choose a different file
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-white/15 hover:border-orange-400/60 bg-white/5 hover:bg-orange-500/5 p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center group"
        >
          <div className="h-10 w-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-300 border border-orange-500/30 group-hover:scale-105 transition-all mb-3">
            <FileUp className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold text-white block">Select Resume PDF</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">PDF or DOCX up to 10MB — parsed for the screening &amp; matching agents</span>
        </button>
      )}

      <div className="space-y-4">
        <div>
          <label className={labelCls}>LinkedIn Profile URL</label>
          <div className="relative">
            <LinkedinIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => update('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>GitHub Profile URL</label>
          <div className="relative">
            <GithubIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="url"
              value={form.githubUrl}
              onChange={(e) => update('githubUrl', e.target.value)}
              placeholder="https://github.com/username"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Portfolio Website</label>
          <div className="relative">
            <Link className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="url"
              value={form.portfolioUrl}
              onChange={(e) => update('portfolioUrl', e.target.value)}
              placeholder="https://yourportfolio.com"
              className={`${inputCls} pl-10`}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">Optional — links feed the profile used by the evaluator &amp; bias-audit agents.</p>
        </div>
      </div>
    </div>
  );
}
