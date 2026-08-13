import { z } from 'zod';


export const ConsentBodySchema = z.object({
  videoConsent: z.boolean().default(true),
  audioConsent: z.boolean().default(true),
});


export const SessionTokenBodySchema = z.object({}).passthrough();


export const EndInterviewBodySchema = z.object({
  transcript: z.unknown().optional(),
  audio_url: z.string().url().optional().or(z.literal('').transform(() => undefined)),
});


export const ProctoringFlagBodySchema = z.object({
  face_count: z.number().optional(),
  gaze_centered: z.boolean().optional(),
  engagement_index: z.number().min(0).max(100).optional(),
  multiple_faces_detected: z.boolean().optional(),
  tab_switch_count: z.number().int().nonnegative().optional(),
});


export const HrResultBodySchema = z.object({
  decision: z.enum(['pass', 'fail'] as const).refine(
    (val) => val === 'pass' || val === 'fail',
    { message: 'Decision must be "pass" or "fail"' },
  ),
  notes: z.string().optional(),
});

export type ConsentBody = z.infer<typeof ConsentBodySchema>;
export type EndInterviewBody = z.infer<typeof EndInterviewBodySchema>;
export type ProctoringFlagBody = z.infer<typeof ProctoringFlagBodySchema>;
export type HrResultBody = z.infer<typeof HrResultBodySchema>;
