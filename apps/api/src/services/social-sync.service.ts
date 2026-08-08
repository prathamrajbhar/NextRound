import fetch from 'node-fetch';

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
  };
  extractedSkills: string[];
  syncedAt: string;
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

  // 1. Sync GitHub Profile if URL provided
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

          // Fetch top public repos
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

  // 2. Sync LinkedIn Metadata if URL provided
  if (linkedinUrl && linkedinUrl.trim()) {
    const match = linkedinUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
    const username = match ? match[1] : 'profile';
    result.linkedin = {
      username,
      profileUrl: linkedinUrl.trim().startsWith('http') ? linkedinUrl.trim() : `https://${linkedinUrl.trim()}`,
      status: 'Synced',
    };
  }

  result.extractedSkills = Array.from(extractedSkillsSet);
  return result;
}
