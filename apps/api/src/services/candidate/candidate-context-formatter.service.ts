import type { CandidateInterviewContext } from '@nextround/shared';
import { hashContent } from './candidate-embedding.service';

export function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function asRecordList(value: unknown): Array<Record<string, unknown>> {
  return asList(value)
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null);
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  return [];
}

export function buildContextText(context: CandidateInterviewContext, maxLength = 3000): string {
  const parts: string[] = [];

  const candidate = context.candidate;
  parts.push(
    `Candidate: ${candidate.fullName || 'N/A'}`,
    `Headline: ${candidate.headline || 'N/A'}`,
    `Location: ${candidate.location || 'N/A'}`,
    `Years of experience: ${candidate.yearsOfExperience ?? 'N/A'}`,
    `Target roles: ${(candidate.targetRoles || []).join(', ') || 'N/A'}`
  );
  if (candidate.bio) parts.push(`Bio: ${candidate.bio}`);

  if (context.skills.length > 0) parts.push(`Skills: ${context.skills.join(', ')}`);

  if (context.resume.rawText) {
    parts.push(`RESUME:\n${context.resume.rawText.slice(0, 4000)}`);
  }

  if (context.social.github) {
    const github = context.social.github as Record<string, unknown>;
    parts.push(`GITHUB: ${JSON.stringify({ name: github.name, bio: github.bio, topLanguages: github.topLanguages, repositories: github.repositories }, null, 0).slice(0, 2000)}`);
  }
  if (context.social.linkedin) {
    const linkedin = context.social.linkedin as Record<string, unknown>;
    parts.push(`LINKEDIN: ${JSON.stringify({ headline: linkedin.headline, about: linkedin.about, skills: linkedin.skills, experiences: linkedin.experiences, education: linkedin.education }, null, 0).slice(0, 2000)}`);
  }

  if (context.experience.length > 0) parts.push(`EXPERIENCE: ${JSON.stringify(context.experience).slice(0, 1500)}`);
  if (context.projects.length > 0) parts.push(`PROJECTS: ${JSON.stringify(context.projects).slice(0, 1500)}`);
  if (context.education.length > 0) parts.push(`EDUCATION: ${JSON.stringify(context.education).slice(0, 1000)}`);

  if (context.interviewFocus.length > 0) {
    parts.push(`MOST RELEVANT PROFILE SECTIONS FOR THE ROLE:\n${context.interviewFocus.map((s) => `[${s.sourceType}/${s.section}]\n${s.content}`).join('\n\n').slice(0, 2500)}`);
  }

  parts.push(
    `JOB: ${context.job.title}`,
    `JOB DESCRIPTION: ${context.job.description.slice(0, 2500)}`
  );

  let text = parts.join('\n\n');
  if (text.length > maxLength) text = text.slice(0, maxLength);
  return text;
}

export function contextHash(text: string): string {
  return hashContent(text);
}
