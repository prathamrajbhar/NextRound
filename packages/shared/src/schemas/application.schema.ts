import { z } from 'zod';
import { ApplicationStatus, DecisionType } from '../enums';

export const ApplicationCreateSchema = z.object({
  jobId: z.string().uuid(),
  resumeUrl: z.string().url().optional(),
});

export const DecisionOverrideSchema = z.object({
  decision: z.nativeEnum(DecisionType),
  reason: z.string().optional(),
});

export const ApplicationStatusOverrideSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  reasoning: z.string().optional(),
});

export const ApplicationScheduleSchema = z.object({
  slotId: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export type ApplicationCreateInput = z.infer<typeof ApplicationCreateSchema>;
export type ApplicationStatusOverrideInput = z.infer<typeof ApplicationStatusOverrideSchema>;
export type ApplicationScheduleInput = z.infer<typeof ApplicationScheduleSchema>;
export type DecisionOverrideInput = z.infer<typeof DecisionOverrideSchema>;
