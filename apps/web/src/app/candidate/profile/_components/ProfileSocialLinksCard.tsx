'use client';

import React from 'react';
import { Code } from '@/lib/lucide-google-icons';

interface ProfileSocialLinksCardProps {
  linkedinUrl: string;
  setLinkedinUrl: (val: string) => void;
  githubUrl: string;
  setGithubUrl: (val: string) => void;
  portfolioUrl: string;
  setPortfolioUrl: (val: string) => void;
}

export function ProfileSocialLinksCard({
  linkedinUrl,
  setLinkedinUrl,
  githubUrl,
  setGithubUrl,
  portfolioUrl,
  setPortfolioUrl,
}: ProfileSocialLinksCardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          LinkedIn URL
        </label>
        <input
          type="url"
          placeholder="https://linkedin.com/in/username"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          GitHub URL
        </label>
        <div className="relative">
          <Code className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="url"
            placeholder="https://github.com/username"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Portfolio Website
        </label>
        <input
          type="url"
          placeholder="https://yourportfolio.dev"
          value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
        />
      </div>
    </div>
  );
}
