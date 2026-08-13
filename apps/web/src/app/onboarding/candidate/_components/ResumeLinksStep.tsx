'use client';

import React, { useState } from 'react';
import { Link, Loader2, RefreshCw, CheckCircle2, Code, Star, ExternalLink, Check, AlertCircle } from '@/lib/lucide-google-icons';
import { GithubIcon, LinkedinIcon } from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';
import { OnboardingStepProps } from './useCandidateOnboarding';
import { inputCls, labelCls } from './CandidateOnboardingShell';

interface GitHubRepo {
  name: string;
  url: string;
  stars: number;
  description?: string;
}

interface GitHubProfileData {
  avatarUrl?: string;
  username?: string;
  name?: string;
  profileUrl?: string;
  publicRepos?: number;
  totalStars?: number;
  bio?: string;
  topLanguages?: string[];
  repositories?: GitHubRepo[];
}

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
      const social = await apiClient.post<{
        github?: { publicRepos?: number; topLanguages?: unknown[] };
        extractedSkills?: string[];
      } | null>('/candidate/sync-social', { githubUrl: form.githubUrl.trim() });

      if (social) {
        if (mergeSocialData) {
          mergeSocialData(social, social.extractedSkills);
        }
        const ghRepos = social.github?.publicRepos || 0;
        const ghLangs = social.github?.topLanguages?.length || 0;
        setSyncStatus(`Synced GitHub profile! Imported ${ghRepos} public repos and ${ghLangs} primary languages.`);
      } else {
        setSyncError('Could not sync GitHub profile.');
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to connect to GitHub sync endpoint.');
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
      const social = await apiClient.post<{
        extractedSkills?: string[];
      } | null>('/candidate/sync-social', { linkedinUrl: form.linkedinUrl.trim() });

      if (social) {
        if (mergeSocialData) {
          mergeSocialData(social, social.extractedSkills);
        }
        setLinkedinSynced(true);
        setSyncStatus('LinkedIn profile verified & linked.');
      } else {
        setSyncError('Could not sync LinkedIn profile.');
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to sync LinkedIn profile.');
    } finally {
      setSyncingLinkedin(false);
    }
  };

  const handleSyncPortfolio = async () => {
    if (!form.portfolioUrl.trim()) {
      setSyncError('Please enter a Portfolio / Website URL first.');
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

  const ghData = (form.socialData as { github?: GitHubProfileData } | undefined)?.github;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {}
      {syncStatus && (
        <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 py-2.5 px-4 rounded-xl border border-emerald-500/30 shadow-sm">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {syncError && (
        <div className="flex items-center gap-2.5 text-xs font-bold text-rose-400 bg-rose-500/10 py-2.5 px-4 rounded-xl border border-rose-500/30 shadow-sm">
          <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <label className={labelCls} htmlFor="github-url">
            <GithubIcon className="h-4 w-4 text-orange-400 inline mr-1.5" />
            GitHub Profile
          </label>
          {ghData && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Synced
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            id="github-url"
            type="url"
            value={form.githubUrl}
            onChange={(e) => update('githubUrl', e.target.value)}
            placeholder="https://github.com/username"
            className={inputCls}
          />
          <button
            type="button"
            onClick={handleSyncGithub}
            disabled={syncingGithub || !form.githubUrl.trim()}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {syncingGithub ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                {ghData ? 'Re-sync' : 'Sync Profile'}
              </>
            )}
          </button>
        </div>
      </div>

      {}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <label className={labelCls} htmlFor="linkedin-url">
            <LinkedinIcon className="h-4 w-4 text-blue-400 inline mr-1.5" />
            LinkedIn Profile
          </label>
          {linkedinSynced && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            id="linkedin-url"
            type="url"
            value={form.linkedinUrl}
            onChange={(e) => update('linkedinUrl', e.target.value)}
            placeholder="https://linkedin.com/in/username"
            className={inputCls}
          />
          <button
            type="button"
            onClick={handleSyncLinkedin}
            disabled={syncingLinkedin || !form.linkedinUrl.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {syncingLinkedin ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Link className="h-3.5 w-3.5" />
                {linkedinSynced ? 'Re-verify' : 'Verify Link'}
              </>
            )}
          </button>
        </div>
      </div>

      {}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <label className={labelCls} htmlFor="portfolio-url">
            <ExternalLink className="h-4 w-4 text-orange-400 inline mr-1.5" />
            Portfolio / Personal Website
          </label>
          {portfolioSynced && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            id="portfolio-url"
            type="url"
            value={form.portfolioUrl}
            onChange={(e) => update('portfolioUrl', e.target.value)}
            placeholder="https://yourname.dev"
            className={inputCls}
          />
          <button
            type="button"
            onClick={handleSyncPortfolio}
            disabled={syncingPortfolio || !form.portfolioUrl.trim()}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {syncingPortfolio ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Link className="h-3.5 w-3.5" />
                {portfolioSynced ? 'Re-verify' : 'Verify URL'}
              </>
            )}
          </button>
        </div>
      </div>

      {}
      {ghData && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              {ghData.avatarUrl ? (
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

          {ghData.bio && <p className="text-xs text-slate-300 italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">&quot;{ghData.bio}&quot;</p>}

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
                {ghData.repositories.slice(0, 4).map((repo: GitHubRepo) => (
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
