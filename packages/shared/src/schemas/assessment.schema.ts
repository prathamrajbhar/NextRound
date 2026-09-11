import { z } from 'zod';

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
  args: z.array(z.unknown()),
  expected: z.unknown(),
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

export type AptitudeQuestionInput = z.infer<typeof AptitudeQuestionSchema>;
export type AptitudeChunkInput = z.infer<typeof AptitudeChunkSchema>;
export type AptitudeChunkRequestInput = z.infer<typeof AptitudeChunkRequestSchema>;
export type CodingProblemInput = z.infer<typeof CodingProblemSchema>;
export type CodingExecutionRequestInput = z.infer<typeof CodingExecutionRequestSchema>;
