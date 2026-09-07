import { z } from 'zod';

export const CandidateProfileSchema = z.object({
  fullName: z.string().max(120).optional().nullable(),
  headline: z.string().max(160).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  location: z.string().max(160).optional().nullable(),
  timezone: z.string().max(80).optional().nullable(),
  avatarUrl: z.string().max(25_000_000).optional().nullable(),
  resumeUrl: z.string().optional().nullable(),
  rawResumeText: z.string().optional().nullable(),
  parsedResume: z.record(z.string(), z.unknown()).optional().nullable(),
  socialData: z.record(z.string(), z.unknown()).optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  githubUrl: z.string().url().optional().nullable(),
  portfolioUrl: z.string().url().optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  skills: z.array(z.string()).default([]),
  targetRoles: z.array(z.string()).default([]),
  yearsOfExperience: z.number().min(0).max(60).optional().nullable(),
  workMode: z.string().optional().nullable(),
  currentCtc: z.number().min(0).optional().nullable(),
  targetLocations: z.array(z.string()).default([]),
  expectedSalary: z.number().min(0).optional().nullable(),
  noticePeriod: z.string().optional().nullable(),
  workAuthorization: z.string().optional().nullable(),
  proudProject: z.string().optional().nullable(),
  workValues: z.array(z.string()).default([]),
  availability: z.record(z.string(), z.unknown()).optional(),
  dataConsent: z.boolean().optional().default(false),
  consentAt: z.string().datetime().optional().nullable(),
});

export const CandidateProfileUpdateSchema = z.object({
  fullName: z.string().max(120).optional().nullable(),
  headline: z.string().max(160).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  location: z.string().max(160).optional().nullable(),
  timezone: z.string().max(80).optional().nullable(),
  portfolioUrl: z.string().url().optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  yearsOfExperience: z.number().min(0).max(60).optional().nullable(),
  workMode: z.string().optional().nullable(),
  currentCtc: z.number().min(0).optional().nullable(),
  targetLocations: z.array(z.string()).optional(),
  targetRoles: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  expectedSalary: z.number().optional().nullable(),
  noticePeriod: z.string().optional().nullable(),
  workAuthorization: z.string().optional().nullable(),
  proudProject: z.string().optional().nullable(),
  workValues: z.array(z.string()).optional(),
  availability: z.record(z.string(), z.unknown()).optional(),
  socialData: z.record(z.string(), z.unknown()).optional().nullable(),
  resumeUrl: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  githubUrl: z.string().url().optional().nullable(),
});

export const CandidateSettingsSchema = z
  .object({
    emailNotifications: z.boolean().optional(),
    privacyMode: z.boolean().optional(),
    timezone: z.string().optional(),
  })
  .passthrough();

export const SocialSyncRequestSchema = z.object({
  githubUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  githubUsername: z.string().optional().nullable(),
  linkedinUsername: z.string().optional().nullable(),
  dataConsent: z.boolean().optional().default(false),
});

export const CandidateEmbeddingSectionSchema = z.object({
  sourceType: z.enum(['resume', 'github', 'linkedin', 'profile']),
  section: z.string().min(1),
  content: z.string().min(1),
  contentHash: z.string().min(1),
  embedding: z.array(z.number()).length(768),
});

export const CandidateEmbeddingBatchSchema = z.object({
  sections: z.array(CandidateEmbeddingSectionSchema).max(50),
});

export const TalentBookmarkCreateSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
  jobId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const TalentOutreachSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
  subject: z.string().min(2, 'Subject is required'),
  body: z.string().min(5, 'Email body is required'),
  jobId: z.string().optional().nullable(),
});

export const TalentPoolSearchSchema = z.object({
  query: z.string().optional(),
  skills: z.union([z.string(), z.array(z.string())]).optional(),
  minMatchScore: z.number().min(0).max(100).optional(),
});

export type CandidateProfileInput = z.infer<typeof CandidateProfileSchema>;
export type CandidateProfileUpdateInput = z.infer<typeof CandidateProfileUpdateSchema>;
export type CandidateSettingsInput = z.infer<typeof CandidateSettingsSchema>;
export type SocialSyncRequestInput = z.infer<typeof SocialSyncRequestSchema>;
export type CandidateEmbeddingBatchInput = z.infer<typeof CandidateEmbeddingBatchSchema>;
