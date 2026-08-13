import { z } from 'zod';














const nullable = <T extends z.ZodTypeAny>(schema: T) => schema.nullable().optional();


export const AiAssistResultSchema = z
  .object({
    description: nullable(z.string()),
    rubric: z.unknown().optional(),
    thresholds: z.unknown().optional(),
    status: z.string().optional(),
    skills: z.unknown().optional(),
  })
  .passthrough();


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


export const SourcedCandidatesSchema = z
  .object({
    candidates: z.array(z.unknown()).optional(),
  })
  .passthrough();


export const CandidateEmbeddingSchema = z
  .object({
    embedding: z.array(z.number()).length(768).optional(),
  })
  .passthrough();


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


export const ScheduleSlotsSchema = z
  .object({
    slots: z.array(z.unknown()).optional(),
    formatted_email: z.string().optional(),
  })
  .passthrough();


export const ConfirmedSlotSchema = z
  .object({
    scheduled_at: nullable(z.string()),
    confirmed_by: nullable(z.string()),
  })
  .passthrough();


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


export const FinalEvaluationSchema = z
  .object({
    application_id: nullable(z.string()),
    composite_score: nullable(z.number()),
    confidence: nullable(z.number()),
    reasoning: nullable(z.string()),
  })
  .passthrough();


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


export const MockFeedbackSchema = z
  .object({
    score: nullable(z.number()),
    feedback: z.unknown().optional(),
    status: z.string().optional(),
  })
  .passthrough();


export const ResumeBuilderResultSchema = z
  .object({
    generatedResume: z.unknown().optional(),
    resumePdfUrl: z.string().optional(),
    status: z.string().optional(),
  })
  .passthrough();


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


export const AnalyticsRawQuerySchema = z
  .object({
    org_id: z.string().optional(),
  })
  .passthrough();


export const AnalyticsReportSchema = z
  .object({
    org_id: nullable(z.string()),
    report_url: z.string().optional(),
    summary: z.string().optional(),
    generated_at: z.string().optional(),
  })
  .passthrough();


export const InterviewSentimentSchema = z
  .object({
    sentiment_report: z.unknown().optional(),
  })
  .passthrough();
