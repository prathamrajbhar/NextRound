import { prisma } from './prisma';

export async function getCandidateProfileId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('401: Session expired. User not found in database.');
  }

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
