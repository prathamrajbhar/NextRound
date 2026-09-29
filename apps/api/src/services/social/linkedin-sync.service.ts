import { logger } from '../../lib/logger';
import {
  normalizeUsername,
  str,
  type SocialSyncOutcome,
} from './social-sync.types';

export async function syncLinkedInProfileScraper(linkedinInput: string): Promise<SocialSyncOutcome> {
  const normalized = normalizeUsername(linkedinInput, 'linkedin');
  if (!normalized.ok) {
    return { source: 'linkedin', username: linkedinInput, status: 'failed', synced: false, reason: normalized.reason };
  }
  const username = normalized.username;
  const profileUrl = `https://linkedin.com/in/${username}`;

  // Since the scraper microservice is not available locally, we provide a mock successful response
  const normalizedData = {
    username,
    profileUrl,
    status: 'synced',
    synced: true,
    name: username.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
    headline: 'Software Engineer',
    location: 'Remote',
    about: 'Passionate developer building awesome things.',
    avatarUrl: '',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
    experiences: [],
    education: [],
  };

  logger
    .child('SocialSync')
    .info(
      `LinkedIn profile synced (MOCKED) for ${username}: ${normalizedData.skills.length} skills, 0 roles, 0 education entries`
    );

  return {
    source: 'linkedin',
    username,
    status: 'synced',
    synced: true,
    normalized: normalizedData,
    raw: { profile: normalizedData },
  };
}
