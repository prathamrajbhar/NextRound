'use client';

import React from 'react';
import { Save } from '@/lib/lucide-google-icons';

interface CandidateProfileBioCardProps {
  portfolioUrl: string;
  setPortfolioUrl: (val: string) => void;
  githubUrl: string;
  setGithubUrl: (val: string) => void;
  linkedinUrl: string;
  setLinkedinUrl: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  saving: boolean;
  saveError: string;
  onSave: () => void;
}

export function CandidateProfileBioCard({
  portfolioUrl,
  setPortfolioUrl,
  githubUrl,
  setGithubUrl,
  linkedinUrl,
  setLinkedinUrl,
  bio,
  setBio,
  saving,
  saveError,
  onSave,
}: CandidateProfileBioCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-6 shadow-md backdrop-blur-md glass-panel space-y-5">
      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        Links &amp; Professional Bio
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Portfolio Website</label>
          <input
            type="text"
            placeholder="https://yourportfolio.com"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">GitHub Profile</label>
          <input
            type="text"
            placeholder="https://github.com/username"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">LinkedIn Profile</label>
          <input
            type="text"
            placeholder="https://linkedin.com/in/username"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">About Me / Summary</label>
          <span className="text-[10px] font-semibold text-slate-400">{bio.length} / 500 chars</span>
        </div>
        <textarea
          rows={3}
          placeholder="Brief description of your background and technical focus..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input resize-none"
        />
      </div>

      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-end items-center gap-3">
        {saveError && (
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{saveError}</span>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving to DB...' : 'Save Profile Details'}
        </button>
      </div>
    </div>
  );
}
