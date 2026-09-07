import { prisma } from '../lib/prisma';
import { Prisma } from '@nextround/database';
import type { SocialSource } from '@nextround/shared';
import { capitalize, type SyncedSocialData, type SocialSyncOutcome } from './social-sync.types';
import { syncGitHubProfileScraper } from './github-sync.service';
import { syncLinkedInProfileScraper } from './linkedin-sync.service';

export * from './social-sync.types';
export * from './github-sync.service';
export * from './linkedin-sync.service';

export async function syncCandidateSocialProfiles(
  githubUrl?: string,
  linkedinUrl?: string
): Promise<SyncedSocialData> {
  const result: SyncedSocialData = {
    extractedSkills: [],
    syncedAt: new Date().toISOString(),
    syncs: [],
  };

  const extractedSkillsSet = new Set<string>();

  if (githubUrl && githubUrl.trim()) {
    const outcome = await syncGitHubProfileScraper(githubUrl.trim());
    result.syncs.push(outcome);
    if (outcome.synced && outcome.normalized) {
      result.github = outcome.normalized as SyncedSocialData['github'];
      const topLanguages = Array.isArray(outcome.normalized.topLanguages) ? (outcome.normalized.topLanguages as string[]) : [];
      topLanguages.forEach((lang) => extractedSkillsSet.add(lang));
      const repositories = Array.isArray(outcome.normalized.repositories) ? (outcome.normalized.repositories as Array<{ topics?: string[] }>) : [];
      repositories.forEach((repo) => {
        (repo.topics || []).forEach((t) => extractedSkillsSet.add(capitalize(t)));
      });
    } else {
      result.github = {
        username: outcome.username,
        profileUrl: `https://github.com/${outcome.username}`,
        publicRepos: 0,
        followers: 0,
        totalStars: 0,
        topLanguages: [],
        repositories: [],
      };
    }
  }

  if (linkedinUrl && linkedinUrl.trim()) {
    const outcome = await syncLinkedInProfileScraper(linkedinUrl.trim());
    result.syncs.push(outcome);
    if (outcome.synced && outcome.normalized) {
      result.linkedin = outcome.normalized as SyncedSocialData['linkedin'];
      const skills = Array.isArray(outcome.normalized.skills) ? (outcome.normalized.skills as string[]) : [];
      skills.forEach((skill) => extractedSkillsSet.add(skill));
    } else {
      result.linkedin = {
        username: outcome.username,
        profileUrl: `https://linkedin.com/in/${outcome.username}`,
        status: outcome.status,
        synced: false,
        reason: outcome.reason,
      };
    }
  }

  result.extractedSkills = Array.from(extractedSkillsSet);
  return result;
}

export async function persistSocialSyncOutcome(candidateId: string, outcome: SocialSyncOutcome): Promise<void> {
  const data = {
    candidate_id: candidateId,
    source: outcome.source as SocialSource,
    username: outcome.username,
    status: outcome.status,
    raw_data: outcome.raw as Prisma.InputJsonValue | undefined,
    normalized_data: outcome.normalized as Prisma.InputJsonValue | undefined,
    error: outcome.synced ? null : outcome.reason ?? null,
    synced_at: outcome.synced ? new Date() : null,
  };

  await prisma.socialProfileSync.upsert({
    where: { candidate_id_source: { candidate_id: candidateId, source: outcome.source as SocialSource } },
    create: data,
    update: data,
  });
}

export async function deleteCandidateSocialSource(candidateId: string, source: SocialSource): Promise<void> {
  const sync = await prisma.socialProfileSync.findUnique({
    where: { candidate_id_source: { candidate_id: candidateId, source } },
  });
  if (!sync) return;

  await prisma.socialProfileSync.update({
    where: { id: sync.id },
    data: { status: 'removed', normalized_data: undefined, synced_at: null },
  });

  const sourceType = source === 'github' ? 'github' : 'linkedin';
  await prisma.candidateEmbedding.deleteMany({
    where: { candidate_id: candidateId, source_type: sourceType },
  });
}

export async function listCandidateSocialSyncs(candidateId: string) {
  return prisma.socialProfileSync.findMany({
    where: { candidate_id: candidateId },
    orderBy: { updated_at: 'desc' },
    select: {
      id: true,
      source: true,
      username: true,
      status: true,
      error: true,
      synced_at: true,
      created_at: true,
      updated_at: true,
    },
  });
}
