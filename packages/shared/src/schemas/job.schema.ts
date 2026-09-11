import { z } from 'zod';

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

export const AnalyticsExportQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
});

export type JobCreateInput = z.infer<typeof JobCreateSchema>;
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>;
