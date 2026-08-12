import { z } from 'zod';

/**
 * Request schemas for the server-to-server internal webhook boundary
 * (`/api/v1/internal/*`). Payloads are produced by the Python AI workers, which
 * mix snake_case and camelCase and may omit optional keys entirely (their
 * `.get(...)` calls default to `None` → JSON null).
 *
 * Schemas are therefore intentionally loose: every field is nullable + optional
 * and the object is `.passthrough()`, so a worker that omits or nulls a field
 * never breaks ingestion. They document the contract, type the validated body,
 * and only reject genuinely malformed payloads (e.g. a string where the worker
 * promised a number).
 */

const nullable = <T extends z.ZodTypeAny>(schema: T) => schema.nullable().optional();

/** PATCH /jobs/:id/ai-assist-result */
export const AiAssistResultSchema = z
  .object({
    description: nullable(z.string()),
    rubric: z.unknown().optional(),
    thresholds: z.unknown().optional(),
    status: z.string().optional(),
    skills: z.unknown().optional(),
  })
  .passthrough();

/** PATCH /applications/:id/screening-result */
export const ScreeningResultSchema = z
  .object({
    status: nullable(z.enum(['screening_completed', 'rejected'])),
    resume_score: nullable(z.number()),
    composite_score: nullable(z.number()),
    semantic_match_score: nullable(z.number()),
    gap_analysis: z.unknown().optional(),
    reasoning: nullable(z.string()),
    rejection_feedback: nullable(z.string()),
  })
  .passthrough();

/** POST /sourcing/:jobId/candidates */
export const SourcedCandidatesSchema = z
  .object({
    candidates: z.array(z.unknown()).optional(),
  })
  .passthrough();

/** PATCH /candidate/:id/embedding */
export const CandidateEmbeddingSchema = z
  .object({
    embedding: z.array(z.number()).length(768).optional(),
  })
  .passthrough();

/** POST /agent-logs */
export const AgentLogCreateSchema = z
  .object({
    job_id: nullable(z.string()),
    org_id: nullable(z.string()),
    agent_name: z.string().optional(),
    action: z.string().optional(),
    input: z.unknown().optional(),
    output: z.unknown().optional(),
    status: z.string().optional(),
    error: nullable(z.string()),
  })
  .passthrough();

/** POST /interviews/:id/schedule-slots */
export const ScheduleSlotsSchema = z
  .object({
    slots: z.array(z.unknown()).optional(),
    formatted_email: z.string().optional(),
  })
  .passthrough();

/** PATCH /interviews/:id/confirmed-slot */
export const ConfirmedSlotSchema = z
  .object({
    scheduled_at: nullable(z.string()),
    confirmed_by: nullable(z.string()),
  })
  .passthrough();

/** PATCH /applications/:id/assessment-result */
export const AssessmentResultSchema = z
  .object({
    score: nullable(z.number()),
    category_scores: z.unknown().optional(),
    total_questions: nullable(z.number()),
    correct_answers: nullable(z.number()),
    status: nullable(z.string()),
    passed: nullable(z.boolean()),
    feedback: nullable(z.string()),
  })
  .passthrough();

/** PATCH /applications/:id/coding-result */
export const CodingResultSchema = z
  .object({
    submissionId: nullable(z.string()),
    score: nullable(z.number()),
    pass_rate: nullable(z.number()),
    complexity_analysis: z.unknown().optional(),
    passed: nullable(z.boolean()),
    feedback: nullable(z.string()),
    execution_time_ms: nullable(z.number()),
    memory_kb: nullable(z.number()),
  })
  .passthrough();

/** PATCH /interviews/:id/result */
export const InterviewResultSchema = z
  .object({
    transcript: z.unknown().optional(),
    audio_url: z.string().optional(),
    interview_score: nullable(z.number()),
    scores: z
      .object({
        composite: nullable(z.number()),
      })
      .passthrough()
      .nullable()
      .optional(),
    reasoning: nullable(z.string()),
    feedback: nullable(z.string()),
    proctor_flags: z.array(z.unknown()).optional(),
    proctor_telemetry: z.unknown().optional(),
  })
  .passthrough();

/** PATCH /evaluations/:id */
export const FinalEvaluationSchema = z
  .object({
    application_id: nullable(z.string()),
    composite_score: nullable(z.number()),
    confidence: nullable(z.number()),
    reasoning: nullable(z.string()),
  })
  .passthrough();

/** PATCH /evaluations/:id/decision */
export const DecisionSchema = z
  .object({
    application_id: nullable(z.string()),
    decision: nullable(z.enum(['hire', 'reject', 'hold_for_review'])),
    decision_rationale: nullable(z.string()),
    auto_offer: nullable(z.boolean()),
    offer_letter_content: nullable(z.string()),
    rejection_email_content: nullable(z.string()),
  })
  .passthrough();

/** POST /offers */
export const InternalOfferCreateSchema = z
  .object({
    application_id: nullable(z.string()),
    role_title: nullable(z.string()),
    salary: nullable(z.number()),
    equity: nullable(z.string()),
    start_date: nullable(z.string()),
    offer_letter_content: nullable(z.string()),
  })
  .passthrough();

/** PATCH /mock/sessions/:id/feedback */
export const MockFeedbackSchema = z
  .object({
    score: nullable(z.number()),
    feedback: z.unknown().optional(),
    status: z.string().optional(),
  })
  .passthrough();

/** PATCH /resume-builder/:sessionId/result */
export const ResumeBuilderResultSchema = z
  .object({
    generatedResume: z.unknown().optional(),
    resumePdfUrl: z.string().optional(),
    status: z.string().optional(),
  })
  .passthrough();

/** POST /prep/generate */
export const PrepGenerateSchema = z
  .object({
    companyName: nullable(z.string()),
    roleArchetype: nullable(z.string()),
    questions: z.array(z.unknown()).optional(),
    cultureNotes: z.string().optional(),
    skillChecklist: z.array(z.unknown()).optional(),
    jobId: nullable(z.string()),
    orgId: nullable(z.string()),
  })
  .passthrough();

/** GET /analytics/raw (query) */
export const AnalyticsRawQuerySchema = z
  .object({
    org_id: z.string().optional(),
  })
  .passthrough();

/** POST /analytics/reports */
export const AnalyticsReportSchema = z
  .object({
    org_id: nullable(z.string()),
    report_url: z.string().optional(),
    summary: z.string().optional(),
    generated_at: z.string().optional(),
  })
  .passthrough();

/** PATCH /interviews/:id/sentiment */
export const InterviewSentimentSchema = z
  .object({
    sentiment_report: z.unknown().optional(),
  })
  .passthrough();
