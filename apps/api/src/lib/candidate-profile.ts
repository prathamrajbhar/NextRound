import { prisma } from './prisma';







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
