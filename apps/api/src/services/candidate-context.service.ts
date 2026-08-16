import { prisma } from '../lib/prisma';
import { notFound } from '../lib/http-errors';
import { env } from '../lib/env';
import { buildContextSections, hashContent, type ContextSection } from './candidate-embedding.service';
import type { CandidateInterviewContext } from '@nextround/shared';

const EMBEDDING_DIM = 768;

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asRecordList(value: unknown): Array<Record<string, unknown>> {
  return asList(value)
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null);
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  return [];
}

async function generateQueryEmbedding(queryText: string): Promise<number[] | null> {
  const aiServiceUrl = env('AI_BASE_URL');
  let resp: Awaited<ReturnType<typeof fetch>>;
  try {
    resp = await fetch(`${aiServiceUrl}/api/v1/embeddings/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: queryText }),
    });
  } catch {
    return null;
  }
  if (!resp.ok) return null;
  let body: { data?: { embedding?: unknown; model?: unknown } };
  try {
    body = (await resp.json()) as { data?: { embedding?: unknown; model?: unknown } };
  } catch {
    return null;
  }
  if (typeof body.data?.model === 'string' && body.data.model.toLowerCase().includes('fallback')) return null;
  const embedding = body.data?.embedding;
  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIM) return null;
  return embedding as number[];
}

interface SemanticRow {
  source_type: string;
  section: string;
  content: string;
}

export async function getCandidateInterviewContext(
  candidateId: string,
  jobId: string
): Promise<CandidateInterviewContext> {
  const profile = await prisma.candidateProfile.findUnique({
    where: { id: candidateId },
    include: { social_syncs: true },
  });
  if (!profile) throw notFound('Candidate profile not found');

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw notFound('Job not found');

  const syncs = profile.social_syncs.map((s) => ({ source: s.source, normalized_data: s.normalized_data }));
  const sections = buildContextSections(profile, syncs);

  const parsedRecord = asRecord(profile.parsed_resume) || {};
  const experience = asRecordList(parsedRecord.experience);
  const projects = asRecordList(parsedRecord.projects);
  const education = asRecordList(parsedRecord.education);
  const achievements = asRecordList(parsedRecord.achievements);

  const githubSync = syncs.find((s) => s.source === 'github');
  const linkedinSync = syncs.find((s) => s.source === 'linkedin');
  const socialBlob = asRecord(profile.social_data) || {};

  const githubData = githubSync?.normalized_data ?? socialBlob.github;
  const linkedinData = linkedinSync?.normalized_data ?? socialBlob.linkedin;

  const social = {
    github: asRecord(githubData),
    linkedin: asRecord(linkedinData),
  };

  let interviewFocus: ContextSection[] = [];
  const jobDescription = job.description || '';
  if (jobDescription.trim()) {
    const queryEmbedding = await generateQueryEmbedding(jobDescription);
    if (queryEmbedding) {
      const vectorStr = `[${queryEmbedding.join(',')}]`;
      try {
        const matches = await prisma.$queryRaw<SemanticRow[]>`
          SELECT source_type, section, content
          FROM "CandidateEmbedding"
          WHERE candidate_id = ${candidateId}
          ORDER BY embedding <=> ${vectorStr}::vector ASC
          LIMIT 5
        `;
        interviewFocus = matches.map((m) => ({
          sourceType: m.source_type as ContextSection['sourceType'],
          section: m.section,
          content: m.content,
        }));
      } catch {
        interviewFocus = [];
      }
    }
  }
  if (interviewFocus.length === 0) {
    interviewFocus = sections.slice(0, 5);
  }

  return {
    candidateId,
    dataConsent: profile.data_consent,
    candidate: {
      fullName: profile.full_name,
      headline: profile.headline,
      location: profile.location,
      timezone: profile.timezone,
      yearsOfExperience: profile.years_of_experience,
      targetRoles: asStringArray(profile.target_roles),
      bio: profile.bio,
      proudProject: profile.proud_project,
    },
    resume: {
      rawText: profile.raw_resume_text,
      parsed: profile.parsed_resume ? asRecord(profile.parsed_resume) : null,
      sections: sections.filter((s) => s.sourceType === 'resume' || s.sourceType === 'profile'),
    },
    social,
    skills: asStringArray(profile.skills),
    experience,
    projects,
    education,
    achievements,
    job: {
      title: job.title,
      description: job.description,
      location: job.location,
      experienceLevel: job.experienceLevel,
      skills: asStringArray(job.skills),
      rubric: job.rubric as Record<string, unknown> | undefined,
      thresholds: job.thresholds as Record<string, unknown> | undefined,
    },
    interviewFocus,
  };
}

export function buildContextText(context: CandidateInterviewContext, maxLength = 3000): string {
  const parts: string[] = [];

  const c = context.candidate;
  parts.push(
    `Candidate: ${c.fullName || 'N/A'}`,
    `Headline: ${c.headline || 'N/A'}`,
    `Location: ${c.location || 'N/A'}`,
    `Years of experience: ${c.yearsOfExperience ?? 'N/A'}`,
    `Target roles: ${(c.targetRoles || []).join(', ') || 'N/A'}`
  );
  if (c.bio) parts.push(`Bio: ${c.bio}`);

  if (context.skills.length > 0) parts.push(`Skills: ${context.skills.join(', ')}`);

  if (context.resume.rawText) {
    parts.push(`RESUME:\n${context.resume.rawText.slice(0, 4000)}`);
  }

  if (context.social.github) {
    const gh = context.social.github as Record<string, unknown>;
    parts.push(`GITHUB: ${JSON.stringify({ name: gh.name, bio: gh.bio, topLanguages: gh.topLanguages, repositories: gh.repositories }, null, 0).slice(0, 2000)}`);
  }
  if (context.social.linkedin) {
    const li = context.social.linkedin as Record<string, unknown>;
    parts.push(`LINKEDIN: ${JSON.stringify({ headline: li.headline, about: li.about, skills: li.skills, experiences: li.experiences, education: li.education }, null, 0).slice(0, 2000)}`);
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