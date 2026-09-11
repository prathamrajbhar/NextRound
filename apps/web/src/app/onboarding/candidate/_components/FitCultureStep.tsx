'use client';

import React, { useState } from 'react';
import { Trophy, ScrollText, RefreshCw } from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';
import { OnboardingStepProps } from './useCandidateOnboarding';
import { inputCls, labelCls } from './CandidateOnboardingShell';
import { WorkValuesRankingList } from './WorkValuesRankingList';

export function FitCultureStep({ form, update, mergeParsedProfile }: OnboardingStepProps) {
  const [reparsing, setReparsing] = useState<string | null>(null);

  const handleRegenerateField = async (field: 'proudProject' | 'bio') => {
    if (reparsing) return;

    setReparsing(field);
    try {
      const payload = {
        field,
        rawResumeText: form.rawResumeText,
        socialData: form.socialData,
        linkedinUrl: form.linkedinUrl,
        githubUrl: form.githubUrl,
        portfolioUrl: form.portfolioUrl,
        skills: form.skills,
        targetRoles: form.targetRoles,
        yearsOfExperience: form.yearsOfExperience,
        currentValue: form[field],
      };

      const regenerated = await apiClient
        .post<{ text?: string }>('/candidate/regenerate-field', payload)
        .catch(() => undefined);

      if (regenerated?.text) {
        update(field, regenerated.text);
      } else if (form.resumeFile) {
        const formData = new FormData();
        formData.append('resume', form.resumeFile);
        const parsed = await apiClient.post<{
          profile?: { proudProject?: string; bio?: string };
          rawText?: string;
        }>('/candidate/parse-resume', formData);

        if (parsed?.profile) {
          if (field === 'proudProject' && parsed.profile.proudProject) {
            update('proudProject', parsed.profile.proudProject);
          } else if (field === 'bio' && parsed.profile.bio) {
            update('bio', parsed.profile.bio);
          }
          if (mergeParsedProfile) {
            mergeParsedProfile(parsed.profile, parsed.rawText);
          }
        }
      }
    } finally {
      setReparsing(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className={labelCls}>Describe a Project You&apos;re Proud Of</label>
          <button
            type="button"
            onClick={() => handleRegenerateField('proudProject')}
            disabled={reparsing === 'proudProject'}
            className="text-slate-400 hover:text-orange-400 p-1 transition-colors cursor-pointer disabled:opacity-50 focus:outline-none"
            title="Regenerate with AI"
          >
            <RefreshCw
              className={`h-4 w-4 transition-transform duration-500 ease-in-out ${
                reparsing === 'proudProject' ? 'animate-spin' : 'hover:rotate-180 active:rotate-180'
              }`}
            />
          </button>
        </div>
        <div className="relative">
          <Trophy className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <textarea
            rows={3}
            value={form.proudProject}
            onChange={(e) => update('proudProject', e.target.value)}
            placeholder="Explain the technical details of something you shipped — stack, your role, and the impact..."
            className={`${inputCls} pl-10 resize-none leading-relaxed`}
          />
        </div>
        <p className="text-xs text-slate-400 font-medium mt-1.5">
          Gives the evaluator agent concrete signal beyond the resume.
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className={labelCls}>About Me / Summary</label>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleRegenerateField('bio')}
              disabled={reparsing === 'bio'}
              className="text-slate-400 hover:text-orange-400 p-1 transition-colors cursor-pointer disabled:opacity-50 focus:outline-none"
              title="Regenerate with AI"
            >
              <RefreshCw
                className={`h-4 w-4 transition-transform duration-500 ease-in-out ${
                  reparsing === 'bio' ? 'animate-spin' : 'hover:rotate-180 active:rotate-180'
                }`}
              />
            </button>
            <span className="text-xs font-mono font-bold text-slate-400">{form.bio.length} / 1000</span>
          </div>
        </div>
        <div className="relative">
          <ScrollText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <textarea
            rows={3}
            maxLength={1000}
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            placeholder="Brief description of your background and what you're looking for..."
            className={`${inputCls} pl-10 resize-none leading-relaxed`}
          />
        </div>
      </div>

      <WorkValuesRankingList
        workValues={form.workValues}
        onChange={(values) => update('workValues', values)}
      />
    </div>
  );
}
