import { z } from 'zod';
import { UserRole, ApplicationStatus, DecisionType } from '../enums';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.nativeEnum(UserRole).default(UserRole.CANDIDATE),
  orgName: z.string().optional(),
}).refine((data) => {
  if (data.role === UserRole.HR && (!data.orgName || data.orgName.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'Organization name is required when registering as HR',
  path: ['orgName'],
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export const OrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  logoUrl: z.string().url().optional().nullable(),
  industry: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  settings: z.record(z.string(), z.any()).optional(),
});

export const CandidateProfileSchema = z.object({
  targetRoles: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  expectedSalary: z.number().optional().nullable(),
  noticePeriod: z.string().optional().nullable(),
  workAuthorization: z.string().optional().nullable(),
  proudProject: z.string().optional().nullable(),
  workValues: z.array(z.string()).default([]),
  resumeUrl: z.string().url().optional().nullable(),
});

export const JobCreateSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  location: z.string().optional(),
  salary: z.string().optional(),
  experienceLevel: z.string().optional(),
  skills: z.array(z.string()).optional(),
  rubric: z.object({
    technical: z.number().min(0).max(100),
    communication: z.number().min(0).max(100),
    problemSolving: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
  }).optional(),
  thresholds: z.object({
    minScore: z.number().min(0).max(100),
    autoOffer: z.boolean(),
  }).optional(),
});

export const ApplicationCreateSchema = z.object({
  jobId: z.string().uuid(),
  resumeUrl: z.string().url().optional(),
});

export const DecisionOverrideSchema = z.object({
  decision: z.nativeEnum(DecisionType),
  reason: z.string().optional(),
});

export const MockSessionCreateSchema = z.object({
  topic: z.string().optional(),
  targetCompany: z.string().optional().default('General Tech'),
  targetRole: z.string().optional().default('Senior Software Engineer'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'junior', 'mid', 'senior', 'lead']).default('medium'),
  focusAreas: z.array(z.string()).optional().default([]),
});

export const ResumeBuilderSessionCreateSchema = z.object({
  targetRole: z.string().min(2, 'Target role is required'),
  targetCompany: z.string().optional().default('Target Enterprise'),
  existingResumeText: z.string().optional(),
  careerGoals: z.string().optional(),
});

export const VoiceRespondPayloadSchema = z.object({
  sessionId: z.string().uuid(),
  text: z.string().optional(),
  audioUrl: z.string().optional(),
  questionNumber: z.number().optional().default(1),
  stage: z.string().optional(),
});

export const MockFeedbackCallbackSchema = z.object({
  overallScore: z.number().min(0).max(100),
  rubricScores: z.record(z.string(), z.number()).optional(),
  perQuestionCoaching: z.array(z.object({
    questionNumber: z.number(),
    questionText: z.string(),
    userAnswerText: z.string(),
    coachingHint: z.string(),
    strengths: z.string(),
    improvements: z.string(),
    starStructureScore: z.number().optional(),
  })).optional(),
  strengths: z.array(z.string()).optional(),
  improvementAreas: z.array(z.string()).optional(),
  suggestedResources: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
});

export const ResumeBuilderCallbackSchema = z.object({
  generatedResume: z.record(z.string(), z.any()),
  resumePdfUrl: z.string().optional(),
  extractedSkills: z.array(z.string()).optional(),
});

export const OrganizationUpdateSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').optional(),
  logoUrl: z.string().url().optional().nullable(),
  industry: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  settings: z.record(z.string(), z.any()).optional(),
  availabilityHours: z.record(z.string(), z.any()).optional(),
});

export const OrganizationSettingsSchema = z.object({
  auto_offer: z.boolean().optional(),
  email_templates: z.record(z.string(), z.any()).optional(),
  notification_prefs: z.record(z.string(), z.any()).optional(),
});

export const MemberInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['hr']).default('hr'),
});

export const JobUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  experienceLevel: z.string().optional(),
  skills: z.array(z.string()).optional(),
  rubric: z.object({
    technical: z.number().min(0).max(100),
    communication: z.number().min(0).max(100),
    problemSolving: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
  }).optional(),
  thresholds: z.object({
    minScore: z.number().min(0).max(100),
    autoOffer: z.boolean(),
  }).optional(),
  status: z.enum(['draft', 'published', 'active', 'paused', 'closed', 'deleted']).optional(),
});

export const ApplicationStatusOverrideSchema = z.object({
  status: z.string(),
  reasoning: z.string().optional(),
});

export const ApplicationScheduleSchema = z.object({
  slotId: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export const CandidateProfileUpdateSchema = z.object({
  targetRoles: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  expectedSalary: z.number().optional().nullable(),
  noticePeriod: z.string().optional().nullable(),
  workAuthorization: z.string().optional().nullable(),
  proudProject: z.string().optional().nullable(),
  workValues: z.array(z.string()).optional(),
  resumeUrl: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  githubUrl: z.string().url().optional().nullable(),
});

export const CandidateSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  privacyMode: z.boolean().default(false),
  timezone: z.string().default('UTC'),
});

export const HRProfileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  timezone: z.string().optional(),
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

export const AnalyticsExportQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
});

export const TalentPoolSearchSchema = z.object({
  query: z.string().optional(),
  skills: z.union([z.string(), z.array(z.string())]).optional(),
  minMatchScore: z.number().min(0).max(100).optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type OrganizationInput = z.infer<typeof OrganizationSchema>;
export type OrganizationUpdateInput = z.infer<typeof OrganizationUpdateSchema>;
export type OrganizationSettingsInput = z.infer<typeof OrganizationSettingsSchema>;
export type MemberInviteInput = z.infer<typeof MemberInviteSchema>;
export type CandidateProfileInput = z.infer<typeof CandidateProfileSchema>;
export type CandidateProfileUpdateInput = z.infer<typeof CandidateProfileUpdateSchema>;
export type JobCreateInput = z.infer<typeof JobCreateSchema>;
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>;
export type ApplicationCreateInput = z.infer<typeof ApplicationCreateSchema>;
export type ApplicationStatusOverrideInput = z.infer<typeof ApplicationStatusOverrideSchema>;
export type ApplicationScheduleInput = z.infer<typeof ApplicationScheduleSchema>;
export type DecisionOverrideInput = z.infer<typeof DecisionOverrideSchema>;
export type MockSessionCreateInput = z.infer<typeof MockSessionCreateSchema>;
export type CandidateSettingsInput = z.infer<typeof CandidateSettingsSchema>;
export type HRProfileUpdateInput = z.infer<typeof HRProfileUpdateSchema>;
