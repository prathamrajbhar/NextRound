import { Router } from 'express';
import { requireInternalSecret } from '../../middleware/internalSecret';
import { asyncHandler, ok, validate } from '../../lib/http';
import { badRequest } from '../../lib/http-errors';
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
import * as internalService from '../../services/internal.service';

export const internalRouter = Router();

internalRouter.use(requireInternalSecret);

internalRouter.patch(
  '/jobs/:id/ai-assist-result',
  validate(AiAssistResultSchema),
  asyncHandler(async (req, res) => {
    ok(res, await internalService.recordAiAssistResult(req.params.id as string, req.body));
  })
);

internalRouter.patch(
  '/applications/:id/screening-result',
  validate(ScreeningResultSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.recordScreeningResult(req.params.id as string, req.body);
    ok(res, data);
  })
);

internalRouter.post(
  '/sourcing/:jobId/candidates',
  validate(SourcedCandidatesSchema),
  asyncHandler(async (req, res) => {
    const job = await internalService.recordSourcedCandidates(req.params.jobId as string, req.body);
    ok(res, job);
  })
);

internalRouter.patch(
  '/candidate/:id/embedding',
  validate(CandidateEmbeddingSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.updateCandidateEmbedding(req.params.id as string, req.body);
    ok(res, data);
  })
);

internalRouter.post(
  '/agent-logs',
  validate(AgentLogCreateSchema),
  asyncHandler(async (req, res) => {
    ok(res, await internalService.createAgentLog(req.body), 201);
  })
);

internalRouter.get(
  '/agent-logs',
  asyncHandler(async (_req, res) => {
    ok(res, await internalService.listAgentLogs());
  })
);

internalRouter.get(
  '/jobs/:id/raw',
  asyncHandler(async (req, res) => {
    ok(res, await internalService.getRawJob(req.params.id as string));
  })
);

internalRouter.get(
  '/applications/:id/raw',
  asyncHandler(async (req, res) => {
    ok(res, await internalService.getRawApplication(req.params.id as string));
  })
);

internalRouter.get(
  '/candidates/:id/sections',
  asyncHandler(async (req, res) => {
    ok(res, await internalService.getCandidateSections(req.params.id as string));
  })
);

internalRouter.post(
  '/candidates/:id/embeddings',
  validate(CandidateEmbeddingsSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.saveCandidateEmbeddings(req.params.id as string, req.body);
    ok(res, data);
  })
);

internalRouter.delete(
  '/candidates/:id/social/:source',
  asyncHandler(async (req, res) => {
    const data = await internalService.deleteCandidateSocialSource(
      req.params.id as string,
      req.params.source as 'github' | 'linkedin'
    );
    ok(res, data);
  })
);

internalRouter.get(
  '/candidates/:id/context',
  asyncHandler(async (req, res) => {
    const jobId = req.query.jobId as string | undefined;
    if (!jobId) {
      throw badRequest('jobId is required');
    }
    ok(res, await internalService.getCandidateInterviewContextInternal(req.params.id as string, jobId));
  })
);

internalRouter.post(
  '/interviews/:id/schedule-slots',
  validate(ScheduleSlotsSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.recordScheduleSlots(req.params.id as string, req.body);
    ok(res, data);
  })
);

internalRouter.patch(
  '/interviews/:id/confirmed-slot',
  validate(ConfirmedSlotSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.confirmInterviewSlot(req.params.id as string, req.body);
    ok(res, data);
  })
);

internalRouter.patch(
  '/applications/:id/assessment-result',
  validate(AssessmentResultSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.recordAssessmentResult(req.params.id as string, req.body);
    ok(res, data);
  })
);

internalRouter.get(
  '/applications/:id/assessment-data',
  asyncHandler(async (req, res) => {
    const testType = (req.query.type as string) || 'aptitude';
    ok(res, await internalService.getAssessmentData(req.params.id as string, testType));
  })
);

internalRouter.patch(
  '/applications/:id/coding-result',
  validate(CodingResultSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.recordCodingResult(req.params.id as string, req.body);
    ok(res, data);
  })
);

internalRouter.patch(
  '/interviews/:id/result',
  validate(InterviewResultSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.recordInterviewResult(req.params.id as string, req.body);
    ok(res, data);
  })
);

internalRouter.patch(
  '/evaluations/:id',
  validate(FinalEvaluationSchema),
  asyncHandler(async (req, res) => {
    ok(res, await internalService.recordFinalEvaluation(req.body));
  })
);

internalRouter.patch(
  '/evaluations/:id/decision',
  validate(DecisionSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.applyDecision(req.params.id as string, req.body);
    ok(res, data);
  })
);

internalRouter.post(
  '/offers',
  validate(InternalOfferCreateSchema),
  asyncHandler(async (req, res) => {
    ok(res, await internalService.createInternalOffer(req.body), 201);
  })
);

internalRouter.patch(
  '/mock/sessions/:id/feedback',
  validate(MockFeedbackSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.recordMockFeedback(req.params.id as string, req.body);
    ok(res, data);
  })
);

internalRouter.patch(
  '/resume-builder/:sessionId/result',
  validate(ResumeBuilderResultSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.recordResumeBuilderResult(
      req.params.sessionId as string,
      req.body
    );
    ok(res, data);
  })
);

internalRouter.post(
  '/prep/generate',
  validate(PrepGenerateSchema),
  asyncHandler(async (req, res) => {
    ok(res, await internalService.generatePrepContent(req.body));
  })
);

internalRouter.get(
  '/analytics/raw',
  validate(AnalyticsRawQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const orgId = req.query.org_id as string | undefined;
    if (!orgId) {
      throw badRequest('org_id is required');
    }
    ok(res, await internalService.getRawAnalytics(orgId));
  })
);

internalRouter.post(
  '/analytics/reports',
  validate(AnalyticsReportSchema),
  asyncHandler(async (req, res) => {
    ok(res, await internalService.recordAnalyticsReport(req.body), 201);
  })
);

internalRouter.patch(
  '/interviews/:id/sentiment',
  validate(InterviewSentimentSchema),
  asyncHandler(async (req, res) => {
    const interview = await internalService.updateInterviewSentiment(
      req.params.id as string,
      req.body
    );
    ok(res, { interview });
  })
);
