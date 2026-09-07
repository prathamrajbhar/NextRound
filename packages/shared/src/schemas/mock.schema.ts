import { z } from 'zod';

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
  generatedResume: z.record(z.string(), z.unknown()),
  resumePdfUrl: z.string().optional(),
  extractedSkills: z.array(z.string()).optional(),
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

export type MockSessionCreateInput = z.infer<typeof MockSessionCreateSchema>;
export type MockAptitudeChunkQueryInput = z.infer<typeof MockAptitudeChunkQuerySchema>;
export type MockAptitudeAnswerInput = z.infer<typeof MockAptitudeAnswerSchema>;
export type MockAptitudeChunkSubmitInput = z.infer<typeof MockAptitudeChunkSubmitSchema>;
export type MockAptitudeSubmitInput = z.infer<typeof MockAptitudeSubmitSchema>;
export type MockCodingSubmitInput = z.infer<typeof MockCodingSubmitSchema>;
export type MockVideoSubmitInput = z.infer<typeof MockVideoSubmitSchema>;
export type MockCompleteInput = z.infer<typeof MockCompleteSchema>;
