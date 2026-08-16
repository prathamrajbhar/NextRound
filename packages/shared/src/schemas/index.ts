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

export const UpdateEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const OrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  logoUrl: z.string().url().optional().nullable(),
  industry: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  settings: z.record(z.string(), z.any()).optional(),
});

export const CandidateProfileSchema = z.object({
  fullName: z.string().max(120).optional().nullable(),
  headline: z.string().max(160).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  location: z.string().max(160).optional().nullable(),
  timezone: z.string().max(80).optional().nullable(),
  avatarUrl: z.string().max(25_000_000).optional().nullable(),
  resumeUrl: z.string().optional().nullable(),
  rawResumeText: z.string().optional().nullable(),
  parsedResume: z.record(z.string(), z.any()).optional().nullable(),
  socialData: z.record(z.string(), z.any()).optional().nullable(),
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
  availability: z.record(z.string(), z.any()).optional(),
});

export const JobCreateSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  location: z.string().optional(),
  salary: z.string().optional(),
  experienceLevel: z.string().optional(),
  department: z.string().optional(),
  skills: z.array(z.string()).optional(),
  stages: z.array(z.enum(['screening', 'assessment', 'voice_screen', 'hr_round', 'panel', 'decision'])).optional(),
  assessmentConfig: z.object({
    mcqCount: z.number().optional(),
    codingProblemId: z.string().optional(),
    passingScore: z.number().optional(),
    mcqDistribution: z.record(z.string(), z.number()).optional(),
  }).optional(),
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
  targetCompany: z.string().optional().nullable(),
  targetRole: z.string().optional().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'junior', 'mid', 'senior', 'lead']).optional().nullable(),
  focusAreas: z.array(z.string()).optional().default([]),
});

export const ResumeBuilderSessionCreateSchema = z.object({
  targetRole: z.string().min(2, 'Target role is required'),
  targetCompany: z.string().optional().nullable(),
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
  department: z.string().optional(),
  skills: z.array(z.string()).optional(),
  stages: z.array(z.enum(['screening', 'assessment', 'voice_screen', 'hr_round', 'panel', 'decision'])).optional(),
  assessmentConfig: z.object({
    mcqCount: z.number().optional(),
    codingProblemId: z.string().optional(),
    passingScore: z.number().optional(),
    mcqDistribution: z.record(z.string(), z.number()).optional(),
  }).optional(),
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
  status: z.nativeEnum(ApplicationStatus),
  reasoning: z.string().optional(),
});

export const ApplicationScheduleSchema = z.object({
  slotId: z.string().optional(),
  scheduledAt: z.string().optional(),
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
  availability: z.record(z.string(), z.any()).optional(),
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



export const HRProfileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().max(25_000_000).optional().nullable(),
  timezone: z.string().optional(),
  linkedinUrl: z.string().max(1000).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  specialties: z.array(z.string()).optional(),
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

export const AptitudeQuestionSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  question: z.string().min(5),
  text: z.string().optional(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().optional(),
  source: z.string().optional(),
});

export const AptitudeChunkSchema = z.array(AptitudeQuestionSchema);

export const AptitudeChunkRequestSchema = z.object({
  chunkIndex: z.number().int().min(0).default(0),
  chunkSize: z.number().int().min(1).max(10).default(3),
  category: z.string().optional(),
});

export const TestCaseSchema = z.object({
  name: z.string(),
  args: z.array(z.any()),
  expected: z.any(),
  hidden: z.boolean().optional().default(false),
});

export const CodingProblemSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(2),
  description: z.string().min(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  entryPoint: z.string().min(1).default('solution'),
  paramSchema: z.array(z.object({
    name: z.string(),
    type: z.string(),
  })).default([]),
  returnType: z.string().default('any'),
  publicTests: z.array(TestCaseSchema).default([]),
  hiddenTests: z.array(TestCaseSchema).default([]),
  referenceSolution: z.record(z.string(), z.string()).optional(),
  seed: z.string().optional(),
  checksum: z.string().optional(),
  version: z.number().int().default(1),
});

export const CodingExecutionRequestSchema = z.object({
  assessmentId: z.string().min(1, 'Assessment ID is required'),
  problemId: z.string().optional(),
  code: z.string().min(1, 'Code candidate string cannot be empty'),
  language: z.enum(['python', 'javascript', 'typescript', 'cpp', 'java']),
  idempotencyKey: z.string().optional(),
});






export const MockAptitudeChunkQuerySchema = z.object({
  chunkIndex: z.coerce.number().int().min(0).default(0),
  chunkSize: z.coerce.number().int().min(1).max(10).default(3),
});

export const MockAptitudeAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedIndex: z.number().int().min(0),
});


export const MockAptitudeChunkSubmitSchema = z.object({
  chunkIndex: z.coerce.number().int().min(0),
  chunkSize: z.coerce.number().int().min(1).max(10).default(3),
  answers: z.array(MockAptitudeAnswerSchema).default([]),
  clientRequestId: z.string().min(1).max(128).optional(),
});


export const MockAptitudeSubmitSchema = z.object({
  answers: z.array(MockAptitudeAnswerSchema).default([]),
  totalTimeSeconds: z.number().int().min(0).optional(),
  tabSwitchCount: z.number().int().min(0).optional(),
  idempotencyKey: z.string().min(1).max(128).optional(),
});


export const MockCodingSubmitSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty').max(200_000, 'Code is too large'),
  language: z.enum(['python', 'javascript', 'typescript', 'java', 'cpp']),
  idempotencyKey: z.string().min(1).max(128).optional(),
});


export const MockVideoSubmitSchema = z.object({
  videoUrl: z.string().url().min(1),
  durationSeconds: z.number().int().min(1).max(600),
  promptId: z.string().optional(),
  promptIndex: z.number().int().min(0).optional(),
  idempotencyKey: z.string().min(1).max(128).optional(),
});


export const MockCompleteSchema = z.object({}).passthrough();

export const FileUploadValidationSchema = z.object({
  allowedMimeTypes: z.array(z.string()).default([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  maxSizeBytes: z.number().int().default(10 * 1024 * 1024),
  allowedExtensions: z.array(z.string()).default(['.pdf', '.doc', '.docx']),
});

export const EnvConfigSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  REFRESH_TOKEN_SECRET: z.string().min(16, 'REFRESH_TOKEN_SECRET must be at least 16 characters'),
  INTERNAL_SERVICE_SECRET: z.string().min(16, 'INTERNAL_SERVICE_SECRET must be at least 16 characters'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  AI_BASE_URL: z.string().default('http://localhost:8000'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type UpdateEmailInput = z.infer<typeof UpdateEmailSchema>;
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
export type CodingProblemInput = z.infer<typeof CodingProblemSchema>;
export type CodingExecutionRequestInput = z.infer<typeof CodingExecutionRequestSchema>;
export type EnvConfigInput = z.infer<typeof EnvConfigSchema>;
export type MockAptitudeChunkQueryInput = z.infer<typeof MockAptitudeChunkQuerySchema>;
export type MockAptitudeAnswerInput = z.infer<typeof MockAptitudeAnswerSchema>;
export type MockAptitudeChunkSubmitInput = z.infer<typeof MockAptitudeChunkSubmitSchema>;
export type MockAptitudeSubmitInput = z.infer<typeof MockAptitudeSubmitSchema>;
export type MockCodingSubmitInput = z.infer<typeof MockCodingSubmitSchema>;
export type MockVideoSubmitInput = z.infer<typeof MockVideoSubmitSchema>;
export type MockCompleteInput = z.infer<typeof MockCompleteSchema>;
export type AptitudeQuestionInput = z.infer<typeof AptitudeQuestionSchema>;
export type AptitudeChunkInput = z.infer<typeof AptitudeChunkSchema>;
export type AptitudeChunkRequestInput = z.infer<typeof AptitudeChunkRequestSchema>;


