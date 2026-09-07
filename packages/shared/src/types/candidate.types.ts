export interface CandidateProfile {
  id: string;
  user_id: string;
  full_name?: string | null;
  headline?: string | null;
  phone?: string | null;
  location?: string | null;
  timezone?: string | null;
  avatar_url?: string | null;
  resume_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  bio?: string | null;
  skills: string[];
  target_roles: string[];
  years_of_experience?: number | null;
  work_mode?: string | null;
  current_ctc?: number | null;
  target_locations: string[];
  expected_salary?: number | null;
  notice_period?: string | null;
  work_authorization?: string | null;
  proud_project?: string | null;
  work_values: string[];
  availability?: Record<string, unknown>;
  data_consent?: boolean;
  data_consent_at?: string | null;
  created_at: string;
}

export type SocialSource = 'github' | 'linkedin';
export type SocialSyncStatus = 'pending' | 'synced' | 'failed' | 'not_found' | 'removed';

export interface SocialProfileSyncDTO {
  id: string;
  candidateId: string;
  source: SocialSource;
  username: string;
  status: SocialSyncStatus;
  error?: string | null;
  syncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EmbeddingSourceType = 'resume' | 'github' | 'linkedin' | 'profile';

export interface CandidateEmbeddingSection {
  sourceType: EmbeddingSourceType;
  section: string;
  content: string;
}

export interface CandidateInterviewContext {
  candidateId: string;
  dataConsent: boolean;
  candidate: {
    fullName?: string | null;
    headline?: string | null;
    location?: string | null;
    timezone?: string | null;
    yearsOfExperience?: number | null;
    targetRoles: string[];
    bio?: string | null;
    proudProject?: string | null;
  };
  resume: {
    rawText?: string | null;
    parsed?: Record<string, unknown> | null;
    sections: CandidateEmbeddingSection[];
  };
  social: {
    github?: Record<string, unknown> | null;
    linkedin?: Record<string, unknown> | null;
  };
  skills: string[];
  experience: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  education: Array<Record<string, unknown>>;
  achievements: Array<Record<string, unknown>>;
  job: {
    title: string;
    description: string;
    location?: string | null;
    experienceLevel?: string | null;
    skills?: string[];
    rubric?: Record<string, unknown>;
    thresholds?: Record<string, unknown>;
  };
  interviewFocus: CandidateEmbeddingSection[];
}

export interface TalentBookmarkDTO {
  id: string;
  orgId: string;
  candidateId: string;
  jobId?: string | null;
  notes?: string | null;
  createdAt: string;
  candidate: CandidateProfile & {
    user: { id: string; email: string };
  };
  job?: { id: string; title: string } | null;
}

export interface TalentPoolCandidateDTO {
  candidateId: string;
  userId: string;
  name: string;
  email: string;
  skills: string[];
  targetRoles: string[];
  resumeUrl?: string | null;
  similarityScore: number | null;
  isBookmarked: boolean;
  bookmarkId?: string | null;
  lastActive: string;
}
