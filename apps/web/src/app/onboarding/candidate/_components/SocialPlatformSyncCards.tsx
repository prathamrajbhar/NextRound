'use client';

import React from 'react';
import { Link, Loader2, RefreshCw, ExternalLink, Check, GithubIcon, LinkedinIcon } from '@/lib/lucide-google-icons';
import { inputCls, labelCls } from './CandidateOnboardingShell';

interface SocialPlatformSyncCardsProps {
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  onUpdate: (field: 'githubUrl' | 'linkedinUrl' | 'portfolioUrl', value: string) => void;
  hasGhData: boolean;
  linkedinSynced: boolean;
  portfolioSynced: boolean;
  syncingGithub: boolean;
  syncingLinkedin: boolean;
  syncingPortfolio: boolean;
  onSyncGithub: () => void;
  onSyncLinkedin: () => void;
  onSyncPortfolio: () => void;
  canSync: boolean;
}

export function SocialPlatformSyncCards({
  githubUrl,
  linkedinUrl,
  portfolioUrl,
  onUpdate,
  hasGhData,
  linkedinSynced,
  portfolioSynced,
  syncingGithub,
  syncingLinkedin,
  syncingPortfolio,
  onSyncGithub,
  onSyncLinkedin,
  onSyncPortfolio,
  canSync,
}: SocialPlatformSyncCardsProps) {
  return (
    <>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <label className={labelCls} htmlFor="github-url">
            <GithubIcon className="h-4 w-4 text-orange-400 inline mr-1.5" />
            GitHub Profile
          </label>
          {hasGhData && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Synced
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            id="github-url"
            type="url"
            value={githubUrl}
            onChange={(e) => onUpdate('githubUrl', e.target.value)}
            placeholder="https://github.com/username"
            className={inputCls}
          />
          <button
            type="button"
            onClick={onSyncGithub}
            disabled={syncingGithub || !canSync || !githubUrl.trim()}
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
                {hasGhData ? 'Re-sync' : 'Sync Profile'}
              </>
            )}
          </button>
        </div>
      </div>

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
            value={linkedinUrl}
            onChange={(e) => onUpdate('linkedinUrl', e.target.value)}
            placeholder="https://linkedin.com/in/username"
            className={inputCls}
          />
          <button
            type="button"
            onClick={handleSyncLinkedinWrapper}
            disabled={syncingLinkedin || !canSync || !linkedinUrl.trim()}
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
            value={portfolioUrl}
            onChange={(e) => onUpdate('portfolioUrl', e.target.value)}
            placeholder="https://yourname.dev"
            className={inputCls}
          />
          <button
            type="button"
            onClick={onSyncPortfolio}
            disabled={syncingPortfolio || !portfolioUrl.trim()}
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
    </>
  );

  function handleSyncLinkedinWrapper() {
    onSyncLinkedin();
  }
}
