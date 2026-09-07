import { Router } from 'express';
import { requireInternalSecret } from '../../middleware/internalSecret';
import { asyncHandler, validate } from '../../lib/http';
import {
  AiAssistResultSchema,
  ScreeningResultSchema,
  SourcedCandidatesSchema,
  CandidateEmbeddingSchema,
  AgentLogCreateSchema,
  ScheduleSlotsSchema,
  ConfirmedSlotSchema,
  AssessmentResultSchema,
  CodingResultSchema,
  InterviewResultSchema,
  FinalEvaluationSchema,
  DecisionSchema,
  InternalOfferCreateSchema,
  MockFeedbackSchema,
  ResumeBuilderResultSchema,
  PrepGenerateSchema,
  AnalyticsRawQuerySchema,
  AnalyticsReportSchema,
  InterviewSentimentSchema,
  CandidateEmbeddingsSchema,
} from '../../validators/internal.schemas';
import {
  patchAiAssistResult,
  patchScreeningResult,
  postSourcedCandidates,
  postScheduleSlots,
  patchConfirmedSlot,
  patchAssessmentResult,
  getAssessmentData,
  patchCodingResult,
  patchInterviewResult,
  patchFinalEvaluation,
  patchDecision,
  postInternalOffer,
} from './internal-pipeline.controller';
import {
  patchCandidateEmbedding,
  postAgentLog,
  getAgentLogs,
  getRawJob,
  getRawApplication,
  getCandidateSections,
  postCandidateEmbeddings,
  deleteCandidateSocial,
  getCandidateContext,
  patchMockFeedback,
  patchResumeBuilderResult,
  postPrepGenerate,
  getRawAnalytics,
  postAnalyticsReport,
  patchInterviewSentiment,
} from './internal-candidate.controller';

export const internalRouter = Router();

internalRouter.use(requireInternalSecret);

internalRouter.patch('/jobs/:id/ai-assist-result', validate(AiAssistResultSchema), asyncHandler(patchAiAssistResult));
internalRouter.patch('/applications/:id/screening-result', validate(ScreeningResultSchema), asyncHandler(patchScreeningResult));
internalRouter.post('/sourcing/:jobId/candidates', validate(SourcedCandidatesSchema), asyncHandler(postSourcedCandidates));
internalRouter.patch('/candidate/:id/embedding', validate(CandidateEmbeddingSchema), asyncHandler(patchCandidateEmbedding));
internalRouter.post('/agent-logs', validate(AgentLogCreateSchema), asyncHandler(postAgentLog));
internalRouter.get('/agent-logs', asyncHandler(getAgentLogs));
internalRouter.get('/jobs/:id/raw', asyncHandler(getRawJob));
internalRouter.get('/applications/:id/raw', asyncHandler(getRawApplication));
internalRouter.get('/candidates/:id/sections', asyncHandler(getCandidateSections));
internalRouter.post('/candidates/:id/embeddings', validate(CandidateEmbeddingsSchema), asyncHandler(postCandidateEmbeddings));
internalRouter.delete('/candidates/:id/social/:source', asyncHandler(deleteCandidateSocial));
internalRouter.get('/candidates/:id/context', asyncHandler(getCandidateContext));
internalRouter.post('/interviews/:id/schedule-slots', validate(ScheduleSlotsSchema), asyncHandler(postScheduleSlots));
internalRouter.patch('/interviews/:id/confirmed-slot', validate(ConfirmedSlotSchema), asyncHandler(patchConfirmedSlot));
internalRouter.patch('/applications/:id/assessment-result', validate(AssessmentResultSchema), asyncHandler(patchAssessmentResult));
internalRouter.get('/applications/:id/assessment-data', asyncHandler(getAssessmentData));
internalRouter.patch('/applications/:id/coding-result', validate(CodingResultSchema), asyncHandler(patchCodingResult));
internalRouter.patch('/interviews/:id/result', validate(InterviewResultSchema), asyncHandler(patchInterviewResult));
internalRouter.patch('/evaluations/:id', validate(FinalEvaluationSchema), asyncHandler(patchFinalEvaluation));
internalRouter.patch('/evaluations/:id/decision', validate(DecisionSchema), asyncHandler(patchDecision));
internalRouter.post('/offers', validate(InternalOfferCreateSchema), asyncHandler(postInternalOffer));
internalRouter.patch('/mock/sessions/:id/feedback', validate(MockFeedbackSchema), asyncHandler(patchMockFeedback));
internalRouter.patch('/resume-builder/:sessionId/result', validate(ResumeBuilderResultSchema), asyncHandler(patchResumeBuilderResult));
internalRouter.post('/prep/generate', validate(PrepGenerateSchema), asyncHandler(postPrepGenerate));
internalRouter.get('/analytics/raw', validate(AnalyticsRawQuerySchema, 'query'), asyncHandler(getRawAnalytics));
internalRouter.post('/analytics/reports', validate(AnalyticsReportSchema), asyncHandler(postAnalyticsReport));
internalRouter.patch('/interviews/:id/sentiment', validate(InterviewSentimentSchema), asyncHandler(patchInterviewSentiment));
