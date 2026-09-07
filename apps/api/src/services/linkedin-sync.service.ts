import { logger } from '../lib/logger';
import {
  normalizeUsername,
  fetchScraperProfile,
  scrapeOutcome,
  parseJsonBody,
  str,
  PROFILE_SCRAPER_TIMEOUT_MS,
  type SocialSyncOutcome,
} from './social-sync.types';

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
    ? (profile.skills as unknown[]).filter((skill): skill is string => typeof skill === 'string' && skill.trim().length > 0)
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
    .info(
      `LinkedIn profile synced for ${username}: ${skills.length} skills, ${(normalizedData.experiences as unknown[]).length} roles, ${(normalizedData.education as unknown[]).length} education entries`
    );

  return {
    source: 'linkedin',
    username,
    status: 'synced',
    synced: true,
    normalized: normalizedData,
    raw: data,
  };
}
