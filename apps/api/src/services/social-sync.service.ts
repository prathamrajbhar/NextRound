import https from 'https';
import { env, envNumber } from '../lib/env';
import { prisma } from '../lib/prisma';
import { Prisma } from '@nextround/database';
import type { SocialSource, SocialSyncStatus } from '@nextround/shared';
import { logger } from '../lib/logger';

export interface SyncedSocialData {
  github?: {
    username: string;
    name?: string;
    avatarUrl?: string;
    bio?: string;
    company?: string;
    location?: string;
    publicRepos: number;
    followers: number;
    totalStars: number;
    topLanguages: string[];
    repositories: Array<{
      name: string;
      description?: string;
      language?: string;
      stars: number;
      forks: number;
      url: string;
      topics?: string[];
    }>;
    profileUrl: string;
  };
  linkedin?: {
    username: string;
    profileUrl: string;
    status: string;
    synced?: boolean;
    reason?: string;
    name?: string;
    headline?: string;
    location?: string;
    about?: string;
    avatarUrl?: string;
    skills?: string[];
    experiences?: unknown[];
    education?: unknown[];
  };
  extractedSkills: string[];
  syncedAt: string;
  syncs: SocialSyncOutcome[];
}

export type SocialSyncPlatform = 'github' | 'linkedin';

export interface SocialSyncOutcome {
  source: SocialSyncPlatform;
  username: string;
  status: SocialSyncStatus;
  synced: boolean;
  reason?: string;
  normalized?: Record<string, unknown>;
  raw?: Record<string, unknown>;
}

const PROFILE_SCRAPER_TIMEOUT_MS = envNumber('PROFILE_SCRAPER_TIMEOUT_MS');

const TLS_VERIFY_ERROR_CODES = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'CERT_HAS_EXPIRED',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'CERT_SIGNATURE_FAILURE',
]);

function isTlsVerificationError(err: unknown): boolean {
  const cause = (err as { cause?: unknown })?.cause as { code?: string } | undefined;
  return Boolean(cause?.code && TLS_VERIFY_ERROR_CODES.has(cause.code));
}

function httpsRequestText(
  url: string,
  options: https.RequestOptions
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () =>
        resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') })
      );
    });
    req.on('error', reject);
    req.setTimeout(PROFILE_SCRAPER_TIMEOUT_MS, () =>
      req.destroy(new Error(`Scraper request timed out after ${PROFILE_SCRAPER_TIMEOUT_MS}ms`))
    );
    req.end();
  });
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function normalizeUsername(
  input: string | undefined | null,
  platform: SocialSyncPlatform
): { ok: true; username: string } | { ok: false; reason: string } {
  const raw = (input || '').trim();
  if (!raw) return { ok: false, reason: `A ${platform} username or profile URL is required.` };

  let candidate = raw;

  const urlPattern =
    platform === 'linkedin' ? /linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i : /github\.com\/([a-zA-Z0-9_-]+)/i;
  const urlMatch = raw.match(urlPattern);
  if (urlMatch) {
    candidate = urlMatch[1];
  }

  candidate = candidate.replace(/^@/, '').replace(/\/+$/, '').split('/').pop() || '';

  const valid =
    platform === 'linkedin'
      ? /^[a-zA-Z0-9_-]{3,100}$/.test(candidate)
      : /^[a-zA-Z0-9](?:-?[a-zA-Z0-9]){0,38}$/.test(candidate);

  if (!valid) {
    return {
      ok: false,
      reason: `Invalid ${platform} username: "${raw}". Provide a valid username or profile URL.`,
    };
  }
  return { ok: true, username: candidate };
}

export async function fetchScraperProfile(
  platform: SocialSyncPlatform,
  username: string
): Promise<{ status: number; body: string; timedOut: boolean }> {
  const base = env('PROFILE_SCRAPER_BASE_URL');
  const url = `${base}/${platform}/${encodeURIComponent(username)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROFILE_SCRAPER_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    return { status: res.status, body: await res.text(), timedOut: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unexpected error';
    const timedOut = (err instanceof Error && err.name === 'AbortError') || /timed out/i.test(message);
    if (!isTlsVerificationError(err)) {
      return { status: 0, body: '', timedOut };
    }
    try {
      const { status, body } = await httpsRequestText(url, {
        headers: { accept: 'application/json' },
        rejectUnauthorized: false,
      });
      return { status, body, timedOut: false };
    } catch (httpsErr) {
      const httpsMsg = httpsErr instanceof Error ? httpsErr.message : 'unexpected error';
      return { status: 0, body: '', timedOut: /timed out/i.test(httpsMsg) };
    }
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonBody(body: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(body);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function scrapeOutcome(
  platform: SocialSyncPlatform,
  username: string,
  reason: string,
  status: SocialSyncStatus = 'failed',
  synced = false
): SocialSyncOutcome {
  return { source: platform, username, status, synced, reason };
}

export async function syncGitHubProfileScraper(githubInput: string): Promise<SocialSyncOutcome> {
  const normalized = normalizeUsername(githubInput, 'github');
  if (!normalized.ok) {
    logger.child('SocialSync').warn(`GitHub sync rejected input: ${normalized.reason}`);
    return { source: 'github', username: githubInput, status: 'failed', synced: false, reason: normalized.reason };
  }
  const username = normalized.username;

  const started = Date.now();
  const { status, body, timedOut } = await fetchScraperProfile('github', username);
  logger
    .child('SocialSync')
    .http(`GitHub scraper responded for ${username}: HTTP ${status || 'ERR'} (${body.length} bytes) in ${Date.now() - started}ms`);
  if (status === 404) {
    return scrapeOutcome('github', username, `GitHub profile '${username}' was not found by the scraper.`, 'not_found');
  }
  if (status === 429) {
    return scrapeOutcome('github', username, 'GitHub scraper is rate limited. Try again in a few minutes.', 'failed');
  }
  if (timedOut) {
    return scrapeOutcome('github', username, `GitHub sync failed: request timed out after ${PROFILE_SCRAPER_TIMEOUT_MS}ms`);
  }
  if (status >= 400 || !body) {
    return scrapeOutcome('github', username, `GitHub scraper returned HTTP ${status}.`);
  }

  const data = parseJsonBody(body);
  if (!data) {
    return scrapeOutcome('github', username, 'GitHub scraper returned a malformed response that could not be parsed.');
  }

  const profile = (data.profile && typeof data.profile === 'object' ? data.profile : {}) as Record<string, unknown>;
  const recentRepos = Array.isArray(data.recent_repositories) ? (data.recent_repositories as unknown[]) : [];
  const pinnedRepos = Array.isArray(data.pinned_repositories) ? (data.pinned_repositories as unknown[]) : [];

  const seen = new Set<string>();
  const repositories: NonNullable<SyncedSocialData['github']>['repositories'] = [];
  const extractedSkills = new Set<string>();
  const languageCounts: Record<string, number> = {};
  let totalStars = 0;

  const pushRepo = (r: unknown) => {
    if (!r || typeof r !== 'object') return;
    const repo = r as Record<string, unknown>;
    const name = str(repo.name) || str(repo.full_name)?.split('/')[1];
    if (!name || seen.has(name)) return;
    seen.add(name);

    const stars = toNumber(repo.stars ?? repo.stargazers_count);
    const language = str(repo.language);
    const topics = Array.isArray(repo.topics) ? (repo.topics as unknown[]).filter((t): t is string => typeof t === 'string' && t.trim().length > 0) : [];

    totalStars += stars;
    if (language) {
      languageCounts[language] = (languageCounts[language] || 0) + 1;
      extractedSkills.add(language);
    }
    topics.forEach((t) => extractedSkills.add(capitalize(t)));

    repositories.push({
      name,
      description: str(repo.description),
      language,
      stars,
      forks: toNumber(repo.forks ?? repo.forks_count),
      url: str(repo.url) || str(repo.html_url) || `https://github.com/${username}/${name}`,
      topics: topics.length > 0 ? topics : undefined,
    });
  };

  pinnedRepos.forEach(pushRepo);
  recentRepos.forEach(pushRepo);

  const topLanguages = Object.entries(languageCounts).sort((a, b) => b[1] - a[1]).map(([lang]) => lang);

  const normalizedData = {
    username,
    name: str(profile.name) || username,
    avatarUrl: str(profile.avatar_url) || str(profile.avatarUrl),
    bio: str(profile.bio),
    company: str(profile.company),
    location: str(profile.location),
    publicRepos: toNumber(profile.public_repos ?? profile.publicRepos ?? profile.total_repos),
    followers: toNumber(profile.followers),
    totalStars,
    topLanguages,
    repositories: repositories.slice(0, 6),
    profileUrl: str(profile.html_url) || `https://github.com/${username}`,
  };

  logger
    .child('SocialSync')
    .info(`GitHub profile synced for ${username}: ${repositories.length} repos, ${totalStars} total stars, top languages: ${topLanguages.join(', ') || 'none'}`);

  return {
    source: 'github',
    username,
    status: 'synced',
    synced: true,
    normalized: normalizedData,
    raw: data,
  };
}

export async function syncLinkedInProfileScraper(linkedinInput: string): Promise<SocialSyncOutcome> {
  const normalized = normalizeUsername(linkedinInput, 'linkedin');
  if (!normalized.ok) {
    return { source: 'linkedin', username: linkedinInput, status: 'failed', synced: false, reason: normalized.reason };
  }
  const username = normalized.username;
  const profileUrl = `https://linkedin.com/in/${username}`;

  const started = Date.now();
  const { status, body, timedOut } = await fetchScraperProfile('linkedin', username);
  logger
    .child('SocialSync')
    .http(`LinkedIn scraper responded for ${username}: HTTP ${status || 'ERR'} (${body.length} bytes) in ${Date.now() - started}ms`);
  if (status === 404) {
    return scrapeOutcome('linkedin', username, `LinkedIn profile '${username}' was not found by the scraper.`, 'not_found');
  }
  if (status === 429) {
    return scrapeOutcome('linkedin', username, 'LinkedIn scraper is rate limited. Try again in a few minutes.', 'failed');
  }
  if (timedOut) {
    return scrapeOutcome('linkedin', username, `LinkedIn sync failed: request timed out after ${PROFILE_SCRAPER_TIMEOUT_MS}ms`);
  }
  if (status >= 400 || !body) {
    return scrapeOutcome('linkedin', username, `LinkedIn scraper returned HTTP ${status}.`);
  }

  const data = parseJsonBody(body);
  if (!data) {
    return scrapeOutcome('linkedin', username, 'LinkedIn scraper returned a malformed response that could not be parsed.');
  }

  const profile = (data.profile && typeof data.profile === 'object' ? data.profile : {}) as Record<string, unknown>;
  const skills = Array.isArray(profile.skills)
    ? (profile.skills as unknown[]).filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : [];

  const normalizedData = {
    username,
    profileUrl,
    status: 'synced',
    synced: true,
    name: str(profile.name),
    headline: str(profile.headline),
    location: str(profile.location),
    about: str(profile.about),
    avatarUrl: str(profile.profile_pic),
    skills,
    experiences: Array.isArray(profile.experiences) ? profile.experiences : [],
    education: Array.isArray(profile.education) ? profile.education : [],
  };

  logger
    .child('SocialSync')
    .info(`LinkedIn profile synced for ${username}: ${skills.length} skills, ${(normalizedData.experiences as unknown[]).length} roles, ${(normalizedData.education as unknown[]).length} education entries`);

  return {
    source: 'linkedin',
    username,
    status: 'synced',
    synced: true,
    normalized: normalizedData,
    raw: data,
  };
}

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