import { logger } from '../../lib/logger';
import {
  normalizeUsername,
  fetchScraperProfile,
  scrapeOutcome,
  parseJsonBody,
  str,
  toNumber,
  capitalize,
  PROFILE_SCRAPER_TIMEOUT_MS,
  type SocialSyncOutcome,
  type SyncedSocialData,
} from './social-sync.types';

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

  const pushRepo = (item: unknown) => {
    if (!item || typeof item !== 'object') return;
    const repo = item as Record<string, unknown>;
    const name = str(repo.name) || str(repo.full_name)?.split('/')[1];
    if (!name || seen.has(name)) return;
    seen.add(name);

    const stars = toNumber(repo.stars ?? repo.stargazers_count);
    const language = str(repo.language);
    const topics = Array.isArray(repo.topics)
      ? (repo.topics as unknown[]).filter((topic): topic is string => typeof topic === 'string' && topic.trim().length > 0)
      : [];

    totalStars += stars;
    if (language) {
      languageCounts[language] = (languageCounts[language] || 0) + 1;
      extractedSkills.add(language);
    }
    topics.forEach((topic) => extractedSkills.add(capitalize(topic)));

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

  const topLanguages = Object.entries(languageCounts)
    .sort((first, second) => second[1] - first[1])
    .map(([lang]) => lang);

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
    .info(
      `GitHub profile synced for ${username}: ${repositories.length} repos, ${totalStars} total stars, top languages: ${topLanguages.join(', ') || 'none'}`
    );

  return {
    source: 'github',
    username,
    status: 'synced',
    synced: true,
    normalized: normalizedData,
    raw: data,
  };
}
