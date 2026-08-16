import { createHash } from 'crypto';
import type { CandidateProfile } from '@nextround/database';
import type { EmbeddingSourceType } from '@nextround/shared';
import { enqueueCandidateEmbedding } from '../lib/queues/candidate-onboarding.queue';
import { logger } from '../lib/logger';

export interface ContextSection {
  sourceType: EmbeddingSourceType;
  section: string;
  content: string;
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function itemsToText(label: string, items: unknown[]): string {
  const lines = items
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        const parts: string[] = [];
        for (const key of ['company', 'organization', 'role', 'title', 'position', 'name', 'duration', 'dates', 'description', 'summary', 'location']) {
          if (typeof rec[key] === 'string' && rec[key].trim()) parts.push(rec[key].trim());
          else if (Array.isArray(rec[key]) && rec[key].length > 0) parts.push(rec[key].map(String).join(', '));
        }
        if (parts.length > 0) return parts.join(' | ');
        return JSON.stringify(rec).slice(0, 500);
      }
      return '';
    })
    .filter(Boolean);

  if (lines.length === 0) return '';
  return `${label}:\n${lines.join('\n')}`;
}

function section(label: string, body: string): string {
  return body.trim() ? `${label}\n${body.trim()}` : '';
}

function normalizeSocial(profile: CandidateProfile, source: 'github' | 'linkedin'): Record<string, unknown> {
  const blob = (profile.social_data && typeof profile.social_data === 'object' ? profile.social_data : {}) as Record<string, unknown>;
  const nested = blob[source] && typeof blob[source] === 'object' ? (blob[source] as Record<string, unknown>) : {};
  return nested;
}

export function buildContextSections(
  profile: CandidateProfile,
  syncs: Array<{ source: string; normalized_data: unknown }> = []
): ContextSection[] {
  const sections: ContextSection[] = [];
  const push = (sourceType: EmbeddingSourceType, sectionName: string, content: string) => {
    if (content.trim()) sections.push({ sourceType, section: sectionName, content: content.trim() });
  };

  const parsed =
    profile.parsed_resume && typeof profile.parsed_resume === 'object' ? (profile.parsed_resume as Record<string, unknown>) : {};

  if (profile.raw_resume_text && profile.raw_resume_text.trim()) {
    push('resume', 'full', profile.raw_resume_text.trim().slice(0, 12000));
  }

  const bio = profile.bio || (typeof parsed.bio === 'string' ? parsed.bio : '');
  const summary = section('SUMMARY', bio) || section('SUMMARY', profile.headline || '');
  if (summary) push('resume', 'summary', summary);

  if (Array.isArray(profile.skills) && profile.skills.length > 0) {
    push('resume', 'skills', `SKILLS\n${profile.skills.join(', ')}`);
  }

  push('resume', 'experience', itemsToText('EXPERIENCE', asList(parsed.experience)));
  push('resume', 'projects', itemsToText('PROJECTS', asList(parsed.projects)));
  push('resume', 'education', itemsToText('EDUCATION', asList(parsed.education)));
  push('resume', 'achievements', itemsToText('ACHIEVEMENTS', asList(parsed.achievements)));

  const githubSync = syncs.find((s) => s.source === 'github');
  const github =
    githubSync && githubSync.normalized_data && typeof githubSync.normalized_data === 'object'
      ? (githubSync.normalized_data as Record<string, unknown>)
      : normalizeSocial(profile, 'github');

  if (github && Object.keys(github).length > 0) {
    const ghProfile = [github.name, github.bio].filter((v): v is string => typeof v === 'string' && v.trim().length > 0).join('. ');
    push('github', 'summary', section('GITHUB PROFILE', ghProfile) || section('GITHUB PROFILE', `GitHub user ${github.username}`));
    const ghSkills = [...asList(github.topLanguages), ...asList(github.extractedSkills)].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    if (ghSkills.length > 0) push('github', 'skills', `GITHUB SKILLS\n${Array.from(new Set(ghSkills)).join(', ')}`);
    push('github', 'projects', itemsToText('GITHUB REPOSITORIES', asList(github.repositories)));
  }

  const linkedinSync = syncs.find((s) => s.source === 'linkedin');
  const linkedin =
    linkedinSync && linkedinSync.normalized_data && typeof linkedinSync.normalized_data === 'object'
      ? (linkedinSync.normalized_data as Record<string, unknown>)
      : normalizeSocial(profile, 'linkedin');

  if (linkedin && Object.keys(linkedin).length > 0) {
    const liSummary = [linkedin.headline, linkedin.about].filter((v): v is string => typeof v === 'string' && v.trim().length > 0).join('. ');
    push('linkedin', 'summary', section('LINKEDIN PROFILE', liSummary) || section('LINKEDIN PROFILE', `LinkedIn user ${linkedin.username}`));
    const liSkills = asList(linkedin.skills).filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    if (liSkills.length > 0) push('linkedin', 'skills', `LINKEDIN SKILLS\n${liSkills.join(', ')}`);
    push('linkedin', 'experience', itemsToText('LINKEDIN EXPERIENCE', asList(linkedin.experiences)));
    push('linkedin', 'education', itemsToText('LINKEDIN EDUCATION', asList(linkedin.education)));
  }

  const profileParts = [
    profile.full_name ? `Candidate: ${profile.full_name}` : '',
    profile.headline ? `Headline: ${profile.headline}` : '',
    profile.location ? `Location: ${profile.location}` : '',
    profile.years_of_experience != null ? `Years of experience: ${profile.years_of_experience}` : '',
    asList(profile.target_roles).length > 0 ? `Target roles: ${asList(profile.target_roles).join(', ')}` : '',
    asList(profile.skills).length > 0 ? `Skills: ${asList(profile.skills).join(', ')}` : '',
    profile.proud_project ? `Proud project: ${profile.proud_project}` : '',
    profile.bio ? `Bio: ${profile.bio}` : '',
  ].filter(Boolean);
  if (profileParts.length > 0) {
    push('profile', 'full', `CANDIDATE PROFILE\n${profileParts.join('\n')}`);
  }

  const bySource = sections.reduce<Record<string, number>>((acc, s) => {
    acc[s.sourceType] = (acc[s.sourceType] || 0) + 1;
    return acc;
  }, {});
  logger
    .child('Embedding')
    .info(`Built ${sections.length} context sections for candidate ${profile.id || 'unknown'}: ${JSON.stringify(bySource)}`);

  return sections;
}

export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export function enqueueEmbeddingRebuild(candidateId: string) {
  return enqueueCandidateEmbedding(candidateId);
}