import { prisma } from '../lib/prisma';
import { notFound } from '../lib/http-errors';
import { env } from '../lib/env';
import { buildContextSections, type ContextSection } from './candidate-embedding.service';
import type { CandidateInterviewContext } from '@nextround/shared';
import { logger } from '../lib/logger';
import {
  asRecord,
  asRecordList,
  asStringArray,
  buildContextText,
  contextHash,
} from './candidate-context-formatter.service';

export { buildContextText, contextHash };

const EMBEDDING_DIM = 768;

async function generateQueryEmbedding(queryText: string): Promise<number[] | null> {
  const aiServiceUrl = env('AI_BASE_URL');
  let response: Awaited<ReturnType<typeof fetch>>;
  try {
    response = await fetch(`${aiServiceUrl}/api/v1/embeddings/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: queryText }),
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;
  let body: { data?: { embedding?: unknown; model?: unknown } };
  try {
    body = (await response.json()) as { data?: { embedding?: unknown; model?: unknown } };
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

  const syncs = profile.social_syncs.map((sync) => ({ source: sync.source, normalized_data: sync.normalized_data }));
  const sections = buildContextSections(profile, syncs);

  const parsedRecord = asRecord(profile.parsed_resume) || {};
  const experience = asRecordList(parsedRecord.experience);
  const projects = asRecordList(parsedRecord.projects);
  const education = asRecordList(parsedRecord.education);
  const achievements = asRecordList(parsedRecord.achievements);

  const githubSync = syncs.find((sync) => sync.source === 'github');
  const linkedinSync = syncs.find((sync) => sync.source === 'linkedin');
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
        interviewFocus = matches.map((match) => ({
          sourceType: match.source_type as ContextSection['sourceType'],
          section: match.section,
          content: match.content,
        }));
        logger
          .child('Context')
          .info(`Semantic search for job ${jobId} against candidate ${candidateId} returned ${matches.length} relevant sections`);
      } catch {
        logger.child('Context').warn(`Semantic search failed for candidate ${candidateId} / job ${jobId}; falling back to first sections`);
        interviewFocus = [];
      }
    } else {
      logger.child('Context').warn(`Could not embed job description for ${jobId}; falling back to first sections`);
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
      sections: sections.filter((section) => section.sourceType === 'resume' || section.sourceType === 'profile'),
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
