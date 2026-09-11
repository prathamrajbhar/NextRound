export interface TalentCandidate {
  candidateId: string;
  applicationId: string | null;
  userId: string;
  name: string;
  email: string;
  skills: string[];
  targetRoles: string[];
  resumeUrl: string | null;
  similarityScore: number | null;
  isBookmarked: boolean;
  bookmarkId: string | null;
  lastActive: string;
}
