'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertCircle } from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';
import { OnboardingStepProps } from './useCandidateOnboarding';
import { GitHubProfileCard, GitHubProfileData } from './GitHubProfileCard';
import { SocialPlatformSyncCards } from './SocialPlatformSyncCards';

export function ResumeLinksStep({ form, update, mergeSocialData }: OnboardingStepProps) {
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [syncingLinkedin, setSyncingLinkedin] = useState(false);
  const [syncingPortfolio, setSyncingPortfolio] = useState(false);

  const [linkedinSynced, setLinkedinSynced] = useState(false);
  const [portfolioSynced, setPortfolioSynced] = useState(false);

  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncGithub = async () => {
    if (!form.dataConsent) {
      setSyncError('Please go back and consent to profile data usage before syncing social profiles.');
      return;
    }
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
      } | null>('/candidate/sync-social', { githubUrl: form.githubUrl.trim(), dataConsent: true });

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
    if (!form.dataConsent) {
      setSyncError('Please go back and consent to profile data usage before syncing social profiles.');
      return;
    }
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
      } | null>('/candidate/sync-social', { linkedinUrl: form.linkedinUrl.trim(), dataConsent: true });

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

      <SocialPlatformSyncCards
        githubUrl={form.githubUrl}
        linkedinUrl={form.linkedinUrl}
        portfolioUrl={form.portfolioUrl}
        onUpdate={(field, val) => update(field, val)}
        hasGhData={Boolean(ghData)}
        linkedinSynced={linkedinSynced}
        portfolioSynced={portfolioSynced}
        syncingGithub={syncingGithub}
        syncingLinkedin={syncingLinkedin}
        syncingPortfolio={syncingPortfolio}
        onSyncGithub={handleSyncGithub}
        onSyncLinkedin={handleSyncLinkedin}
        onSyncPortfolio={handleSyncPortfolio}
        canSync={form.dataConsent}
      />

      {ghData && <GitHubProfileCard ghData={ghData} />}
    </div>
  );
}
