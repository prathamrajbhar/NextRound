import https from 'https';
import { env, envNumber } from '../lib/env';

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
      req.destroy(new Error(`LinkedIn scraper request timed out after ${PROFILE_SCRAPER_TIMEOUT_MS}ms`))
    );
    req.end();
  });
}

async function fetchLinkedInProfileRaw(username: string): Promise<{ status: number; body: string }> {
  const base = env('PROFILE_SCRAPER_BASE_URL');
  const url = `${base}/linkedin/${encodeURIComponent(username)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROFILE_SCRAPER_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    return { status: res.status, body: await res.text() };
  } catch (err) {
    
    
    
    
    if (!isTlsVerificationError(err)) throw err;
    return httpsRequestText(url, { rejectUnauthorized: false });
  } finally {
    clearTimeout(timeout);
  }
}

async function syncLinkedInProfile(linkedinUrl: string): Promise<NonNullable<SyncedSocialData['linkedin']>> {
  const profileUrl = linkedinUrl.trim().startsWith('http') ? linkedinUrl.trim() : `https://${linkedinUrl.trim()}`;
  const match = linkedinUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  const username = match ? match[1] : null;

  if (!username) {
    return {
      username: 'profile',
      profileUrl,
      status: 'not_synced',
      synced: false,
      reason: 'Could not extract a LinkedIn username from the provided URL.',
    };
  }

  try {
    const { status, body } = await fetchLinkedInProfileRaw(username);

    if (status === 404) {
      return {
        username,
        profileUrl,
        status: 'not_found',
        synced: false,
        reason: `LinkedIn profile '${username}' was not found by the scraper.`,
      };
    }
    if (status >= 400) {
      return {
        username,
        profileUrl,
        status: 'not_synced',
        synced: false,
        reason: `LinkedIn scraper returned HTTP ${status}.`,
      };
    }

    let data: { profile?: Record<string, unknown> } | null = null;
    try {
      data = JSON.parse(body) as { profile?: Record<string, unknown> };
    } catch {
      return {
        username,
        profileUrl,
        status: 'not_synced',
        synced: false,
        reason: 'LinkedIn scraper returned a malformed response that could not be parsed.',
      };
    }

    const profile = data?.profile || {};
    const skills = Array.isArray(profile.skills)
      ? (profile.skills as unknown[]).filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : [];

    return {
      username,
      profileUrl,
      status: 'synced',
      synced: true,
      name: typeof profile.name === 'string' && profile.name.trim() ? profile.name : undefined,
      headline: typeof profile.headline === 'string' && profile.headline.trim() ? profile.headline : undefined,
      location: typeof profile.location === 'string' && profile.location.trim() ? profile.location : undefined,
      about: typeof profile.about === 'string' && profile.about.trim() ? profile.about : undefined,
      avatarUrl:
        typeof profile.profile_pic === 'string' && profile.profile_pic.trim() ? profile.profile_pic : undefined,
      skills,
      experiences: Array.isArray(profile.experiences) ? profile.experiences : [],
      education: Array.isArray(profile.education) ? profile.education : [],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unexpected error';
    const timedOut =
      (err instanceof Error && err.name === 'AbortError') || /timed out/i.test(message);
    return {
      username,
      profileUrl,
      status: 'not_synced',
      synced: false,
      reason: timedOut
        ? `LinkedIn sync failed: request timed out after ${PROFILE_SCRAPER_TIMEOUT_MS}ms`
        : `LinkedIn sync failed: ${message}`,
    };
  }
}

export async function syncCandidateSocialProfiles(
  githubUrl?: string,
  linkedinUrl?: string
): Promise<SyncedSocialData> {
  const result: SyncedSocialData = {
    extractedSkills: [],
    syncedAt: new Date().toISOString(),
  };

  const extractedSkillsSet = new Set<string>();

  
  if (githubUrl && githubUrl.trim()) {
    try {
      const match = githubUrl.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
      const username = match ? match[1] : githubUrl.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/$/, '');

      if (username) {
        const userRes = await fetch(`https://api.github.com/users/${username}`, {
          headers: { 'User-Agent': 'NextRound-AI-App' },
        });

        if (userRes.ok) {
          const userData = (await userRes.json()) as any;

          
          const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=12`, {
            headers: { 'User-Agent': 'NextRound-AI-App' },
          });

          let reposData: any[] = [];
          if (reposRes.ok) {
            reposData = (await reposRes.json()) as any[];
          }

          let totalStars = 0;
          const languageCounts: Record<string, number> = {};
          const repositories = [];

          for (const repo of reposData) {
            if (repo.fork) continue;
            totalStars += repo.stargazers_count || 0;
            if (repo.language) {
              languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
              extractedSkillsSet.add(repo.language);
            }
            if (Array.isArray(repo.topics)) {
              repo.topics.forEach((t: string) => {
                if (t && t.length > 1) {
                  extractedSkillsSet.add(t.charAt(0).toUpperCase() + t.slice(1));
                }
              });
            }

            repositories.push({
              name: repo.name,
              description: repo.description || undefined,
              language: repo.language || undefined,
              stars: repo.stargazers_count || 0,
              forks: repo.forks_count || 0,
              url: repo.html_url,
              topics: repo.topics || [],
            });
          }

          const topLanguages = Object.entries(languageCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([lang]) => lang);

          result.github = {
            username,
            name: userData.name || undefined,
            avatarUrl: userData.avatar_url || undefined,
            bio: userData.bio || undefined,
            company: userData.company || undefined,
            location: userData.location || undefined,
            publicRepos: userData.public_repos || 0,
            followers: userData.followers || 0,
            totalStars,
            topLanguages,
            repositories: repositories.slice(0, 6),
            profileUrl: userData.html_url || `https://github.com/${username}`,
          };
        }
      }
    } catch (err) {
      console.error('Error syncing GitHub profile:', err);
    }
  }

  
  
  
  
  
  
  if (linkedinUrl && linkedinUrl.trim()) {
    result.linkedin = await syncLinkedInProfile(linkedinUrl.trim());
    result.linkedin.skills?.forEach((skill) => extractedSkillsSet.add(skill));
  }

  result.extractedSkills = Array.from(extractedSkillsSet);
  return result;
}
