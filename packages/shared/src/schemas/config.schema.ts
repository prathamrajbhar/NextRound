import { z } from 'zod';

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
  AWS_ENDPOINT_URL: z.string().optional(),
  AWS_DEFAULT_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
});

export type EnvConfigInput = z.infer<typeof EnvConfigSchema>;
