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
} from '../../validators/internal.schemas';
import * as internalService from '../../services/internal.service';

export const internalRouter = Router();

// Require internal service secret on all internal routes
internalRouter.use(requireInternalSecret);

// 1. PATCH /jobs/:id/ai-assist-result
internalRouter.patch(
  '/jobs/:id/ai-assist-result',
  validate(AiAssistResultSchema),
  asyncHandler(async (req, res) => {
    ok(res, await internalService.recordAiAssistResult(req.params.id as string, req.body));
  })
);

// 2. PATCH /applications/:id/screening-result
internalRouter.patch(
  '/applications/:id/screening-result',
  validate(ScreeningResultSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.recordScreeningResult(req.params.id as string, req.body);
    ok(res, data);
  })
);

// 3. POST /sourcing/:jobId/candidates
internalRouter.post(
  '/sourcing/:jobId/candidates',
  validate(SourcedCandidatesSchema),
  asyncHandler(async (req, res) => {
    const job = await internalService.recordSourcedCandidates(req.params.jobId as string, req.body);
    ok(res, job);
  })
);

// 4. PATCH /candidate/:id/embedding
internalRouter.patch(
  '/candidate/:id/embedding',
  validate(CandidateEmbeddingSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.updateCandidateEmbedding(req.params.id as string, req.body);
    ok(res, data);
  })
);

// 5. POST /agent-logs
internalRouter.post(
  '/agent-logs',
  validate(AgentLogCreateSchema),
  asyncHandler(async (req, res) => {
    ok(res, await internalService.createAgentLog(req.body), 201);
  })
);

// 6. GET /agent-logs
internalRouter.get(
  '/agent-logs',
  asyncHandler(async (_req, res) => {
    ok(res, await internalService.listAgentLogs());
  })
);

// 7. GET /jobs/:id/raw
internalRouter.get(
  '/jobs/:id/raw',
  asyncHandler(async (req, res) => {
    ok(res, await internalService.getRawJob(req.params.id as string));
  })
);

// 8. GET /applications/:id/raw
internalRouter.get(
  '/applications/:id/raw',
  asyncHandler(async (req, res) => {
    ok(res, await internalService.getRawApplication(req.params.id as string));
  })
);

// 9. POST /interviews/:id/schedule-slots
internalRouter.post(
  '/interviews/:id/schedule-slots',
  validate(ScheduleSlotsSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.recordScheduleSlots(req.params.id as string, req.body);
    ok(res, data);
  })
);

// 10. PATCH /interviews/:id/confirmed-slot
internalRouter.patch(
  '/interviews/:id/confirmed-slot',
  validate(ConfirmedSlotSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.confirmInterviewSlot(req.params.id as string, req.body);
    ok(res, data);
  })
);

// 11. PATCH /applications/:id/assessment-result
internalRouter.patch(
  '/applications/:id/assessment-result',
  validate(AssessmentResultSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.recordAssessmentResult(req.params.id as string, req.body);
    ok(res, data);
  })
);

// GET /applications/:id/assessment-data - Fetch stored assessment questions for scoring
internalRouter.get(
  '/applications/:id/assessment-data',
  asyncHandler(async (req, res) => {
    const testType = (req.query.type as string) || 'aptitude';
    ok(res, await internalService.getAssessmentData(req.params.id as string, testType));
  })
);

// 12. PATCH /applications/:id/coding-result
internalRouter.patch(
  '/applications/:id/coding-result',
  validate(CodingResultSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.recordCodingResult(req.params.id as string, req.body);
    ok(res, data);
  })
);

// 14. PATCH /interviews/:id/result
internalRouter.patch(
  '/interviews/:id/result',
  validate(InterviewResultSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.recordInterviewResult(req.params.id as string, req.body);
    ok(res, data);
  })
);

// 15. PATCH /evaluations/:id
internalRouter.patch(
  '/evaluations/:id',
  validate(FinalEvaluationSchema),
  asyncHandler(async (req, res) => {
    ok(res, await internalService.recordFinalEvaluation(req.body));
  })
);

// 16. PATCH /evaluations/:id/decision
internalRouter.patch(
  '/evaluations/:id/decision',
  validate(DecisionSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.applyDecision(req.params.id as string, req.body);
    ok(res, data);
  })
);

// 17. POST /offers
internalRouter.post(
  '/offers',
  validate(InternalOfferCreateSchema),
  asyncHandler(async (req, res) => {
    ok(res, await internalService.createInternalOffer(req.body), 201);
  })
);

// 18. PATCH /mock/sessions/:id/feedback
internalRouter.patch(
  '/mock/sessions/:id/feedback',
  validate(MockFeedbackSchema),
  asyncHandler(async (req, res) => {
    const data = await internalService.recordMockFeedback(req.params.id as string, req.body);
    ok(res, data);
  })
);

// 19. PATCH /resume-builder/:sessionId/result
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

// 20. POST /prep/generate
internalRouter.post(
  '/prep/generate',
  validate(PrepGenerateSchema),
  asyncHandler(async (req, res) => {
    ok(res, await internalService.generatePrepContent(req.body));
  })
);

// 21. GET /analytics/raw - Raw aggregated analytics data for Python Analytics Agent
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

// 22. POST /analytics/reports - Receive generated PDF analytics report metadata
internalRouter.post(
  '/analytics/reports',
  validate(AnalyticsReportSchema),
  asyncHandler(async (req, res) => {
    ok(res, await internalService.recordAnalyticsReport(req.body), 201);
  })
);

// 23. PATCH /interviews/:id/sentiment - Update sentiment report from Python worker
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
