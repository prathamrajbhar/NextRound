import { z } from 'zod';

export const CreateProctoringSessionSchema = z.object({
  id: z.string().uuid('Session ID must be a valid UUID'),
  candidate_id: z.string().uuid('Candidate ID must be a valid UUID'),
  session_type: z
    .enum(['aptitude', 'coding', 'video', 'interview', 'technical'])
    .transform((val) => (val === 'technical' ? ('interview' as const) : val)),
  assessment_id: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  application_id: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  mock_session_id: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  policy_version: z.string().default('assessment-v1'),
  consent_version: z.string().default('v1'),
});

export const ProctoringEventSchema = z.object({
  client_event_id: z.string().uuid('Event ID must be a valid UUID'),
  client_sequence: z.number().int().nonnegative(),
  kind: z.string().min(1, 'Event kind is required'),
  severity: z.enum(['info', 'warning', 'low', 'medium', 'high']),
  source: z.string().min(1, 'Event source is required'),
  client_timestamp: z.string().datetime({ message: 'Must be ISO 8601 datetime format' }),
  session_elapsed_ms: z.number().int().nonnegative(),
  payload_json: z.record(z.string(), z.any()).nullable().optional(),
});

export const BatchEventsSchema = z.object({
  events: z.array(ProctoringEventSchema).nonempty('Events array cannot be empty'),
});

export const ReviewViolationSchema = z.object({
  status: z.enum(['acknowledged', 'false_positive', 'escalated', 'resolved']),
  review_reason: z.string().min(1, 'Review notes/reason is required'),
});

export const RecordingUploadSchema = z.object({
  duration_ms: z.coerce.number().int().nonnegative().optional(),
});

export const EvidenceUploadSchema = z.object({
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
});
