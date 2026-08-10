import { prisma } from './prisma';

/**
 * Get the candidate's profile id, creating the profile row on first use.
 * A candidate profile is created lazily the first time a user needs one
 * (mock sessions, resume builder), so this helper is the single source of
 * that upsert-on-first-touch behavior.
 */
export async function getCandidateProfileId(userId: string): Promise<string> {
  let profile = await prisma.candidateProfile.findUnique({
    where: { user_id: userId },
    select: { id: true },
  });
  if (!profile) {
    profile = await prisma.candidateProfile.create({
      data: { user_id: userId },
      select: { id: true },
    });
  }
  return profile.id;
}
