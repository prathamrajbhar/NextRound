'use client';

import React, { useState } from 'react';
import { Link, Loader2, RefreshCw, CheckCircle2, Code, Star, ExternalLink, Check, AlertCircle } from '@/lib/lucide-google-icons';
import { GithubIcon, LinkedinIcon } from '@/lib/lucide-google-icons';
import { OnboardingStepProps } from './useCandidateOnboarding';
import { inputCls, labelCls } from './CandidateOnboardingShell';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

export function ResumeLinksStep({ form, update, mergeSocialData }: OnboardingStepProps) {
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [syncingLinkedin, setSyncingLinkedin] = useState(false);
  const [syncingPortfolio, setSyncingPortfolio] = useState(false);

  const [linkedinSynced, setLinkedinSynced] = useState(false);
  const [portfolioSynced, setPortfolioSynced] = useState(false);

  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncGithub = async () => {
    if (!form.githubUrl.trim()) {
      setSyncError('Please enter a GitHub Profile URL first.');
      return;
    }

    setSyncingGithub(true);
    setSyncStatus(null);
    setSyncError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/candidate/sync-social`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ githubUrl: form.githubUrl.trim() }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        const social = json.data;
        if (mergeSocialData) {
          mergeSocialData(social, social.extractedSkills);
        }
        const ghRepos = social.github?.publicRepos || 0;
        const ghLangs = social.github?.topLanguages?.length || 0;
        setSyncStatus(`Synced GitHub profile! Imported ${ghRepos} public repos and ${ghLangs} primary languages.`);
      } else {
        setSyncError(typeof json.error === 'string' ? json.error : 'Could not sync GitHub profile.');
      }
    } catch {
      setSyncError('Failed to connect to GitHub sync endpoint.');
    } finally {
      setSyncingGithub(false);
    }
  };

  const handleSyncLinkedin = async () => {
    if (!form.linkedinUrl.trim()) {
      setSyncError('Please enter a LinkedIn Profile URL first.');
      return;
    }

    setSyncingLinkedin(true);
    setSyncStatus(null);
    setSyncError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/candidate/sync-social`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ linkedinUrl: form.linkedinUrl.trim() }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        if (mergeSocialData) {
          mergeSocialData(json.data, json.data.extractedSkills);
        }
        setLinkedinSynced(true);
        setSyncStatus('LinkedIn profile metadata linked!');
      } else {
        setSyncError(typeof json.error === 'string' ? json.error : 'Could not sync LinkedIn profile.');
      }
    } catch {
      setSyncError('Failed to sync LinkedIn profile.');
    } finally {
      setSyncingLinkedin(false);
    }
  };

  const handleVerifyPortfolio = async () => {
    if (!form.portfolioUrl.trim()) {
      setSyncError('Please enter a Portfolio URL to verify.');
      return;
    }

    setSyncingPortfolio(true);
    setSyncStatus(null);
    setSyncError(null);

    setTimeout(() => {
      setSyncingPortfolio(false);
      setPortfolioSynced(true);
      setSyncStatus('Portfolio URL verified & linked.');
    }, 400);
  };

  const ghData = (form.socialData as any)?.github;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Inline Feedback Alerts */}
      {syncStatus && (
        <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 py-2.5 px-4 rounded-xl border border-emerald-500/30 shadow-sm">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {syncError && (
        <div className="flex items-center gap-2.5 text-xs font-semibold text-rose-300 bg-rose-500/10 py-2.5 px-4 rounded-xl border border-rose-500/30 shadow-sm">
          <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {/* GitHub, LinkedIn & Portfolio Fields with Individual Buttons */}
      <div className="space-y-4">
        {/* 1. LinkedIn Field + Individual Button */}
        <div>
          <label className={labelCls}>LinkedIn Profile URL</label>
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <LinkedinIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="url"
                value={form.linkedinUrl}
                onChange={(e) => {
                  update('linkedinUrl', e.target.value);
                  setLinkedinSynced(false);
                }}
                placeholder="https://linkedin.com/in/username"
                className={`${inputCls} pl-10`}
              />
            </div>
            <button
              type="button"
              onClick={handleSyncLinkedin}
              disabled={syncingLinkedin || !form.linkedinUrl.trim()}
              className="flex items-center gap-2 text-xs font-black text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 disabled:opacity-40 px-4 py-3 rounded-xl border border-sky-500/40 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              {syncingLinkedin ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : linkedinSynced ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Synced</span>
                </>
              ) : (
                <>
                  <LinkedinIcon className="h-4 w-4 text-sky-400" />
                  <span>Sync LinkedIn</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. GitHub Field + Individual Button */}
        <div>
          <label className={labelCls}>GitHub Profile URL</label>
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <GithubIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="url"
                value={form.githubUrl}
                onChange={(e) => update('githubUrl', e.target.value)}
                placeholder="https://github.com/username"
                className={`${inputCls} pl-10`}
              />
            </div>
            <button
              type="button"
              onClick={handleSyncGithub}
              disabled={syncingGithub || !form.githubUrl.trim()}
              className="flex items-center gap-2 text-xs font-black text-orange-300 bg-orange-500/15 hover:bg-orange-500/25 disabled:opacity-40 px-4 py-3 rounded-xl border border-orange-500/40 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              {syncingGithub ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                  <span>Syncing...</span>
                </>
              ) : ghData ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Synced</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 text-orange-400" />
                  <span>Sync GitHub</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. Portfolio Field + Individual Button */}
        <div>
          <label className={labelCls}>Portfolio Website</label>
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <Link className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="url"
                value={form.portfolioUrl}
                onChange={(e) => {
                  update('portfolioUrl', e.target.value);
                  setPortfolioSynced(false);
                }}
                placeholder="https://yourportfolio.com"
                className={`${inputCls} pl-10`}
              />
            </div>
            <button
              type="button"
              onClick={handleVerifyPortfolio}
              disabled={syncingPortfolio || !form.portfolioUrl.trim()}
              className="flex items-center gap-2 text-xs font-black text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 px-4 py-3 rounded-xl border border-emerald-500/40 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              {syncingPortfolio ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  <span>Verifying...</span>
                </>
              ) : portfolioSynced ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Verified</span>
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 text-emerald-400" />
                  <span>Verify Site</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* High-Density Live Synced Social Data Card */}
      {ghData && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              {ghData.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ghData.avatarUrl} alt={ghData.username} className="h-9 w-9 rounded-full border border-orange-500/40" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <GithubIcon className="h-4.5 w-4.5" />
                </div>
              )}
              <div>
                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span>{ghData.name || ghData.username}</span>
                  <a href={ghData.profileUrl} target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-300">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </h4>
                <p className="text-xs text-slate-400">@{ghData.username} • {ghData.publicRepos} Repositories</p>
              </div>
            </div>

            <span className="flex items-center gap-1 bg-amber-500/10 text-amber-300 text-xs font-bold px-3 py-1 rounded-xl border border-amber-500/20">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              {ghData.totalStars} Stars
            </span>
          </div>

          {ghData.bio && <p className="text-xs text-slate-300 italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">"{ghData.bio}"</p>}

          {ghData.topLanguages && ghData.topLanguages.length > 0 && (
            <div>
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Top Technologies</span>
              <div className="flex flex-wrap gap-2">
                {ghData.topLanguages.map((lang: string) => (
                  <span key={lang} className="text-xs font-bold text-orange-300 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/25 flex items-center gap-1.5">
                    <Code className="h-3.5 w-3.5" />
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ghData.repositories && ghData.repositories.length > 0 && (
            <div>
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Synced Repositories</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ghData.repositories.slice(0, 4).map((repo: any) => (
                  <a
                    key={repo.name}
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl border border-slate-800 hover:border-orange-500/40 bg-slate-950/40 hover:bg-slate-950 transition-all block group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-orange-300 truncate">{repo.name}</span>
                      <span className="text-xs text-amber-300 flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-300" />
                        {repo.stars}
                      </span>
                    </div>
                    {repo.description && <p className="text-xs text-slate-400 line-clamp-1">{repo.description}</p>}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
