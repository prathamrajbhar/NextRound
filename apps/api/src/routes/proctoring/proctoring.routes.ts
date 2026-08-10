import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler, ok, validate } from '../../lib/http';
import { forbidden } from '../../lib/http-errors';
import { CreateProctoringSessionSchema, BatchEventsSchema, ReviewViolationSchema } from '../../validators/proctoring.schemas';
import * as proctoringService from '../../services/proctoring.service';

export const proctoringRouter = Router();

// Enforce authentication on all routes
proctoringRouter.use(authenticate);

// 1. POST /api/v1/proctoring/sessions - Start new proctoring session
proctoringRouter.post(
  '/sessions',
  validate(CreateProctoringSessionSchema),
  asyncHandler(async (req, res) => {
    const session = await proctoringService.createProctoringSession(req.body, req.user!.userId);
    ok(res, session, 201);
  })
);

// 2. POST /api/v1/proctoring/sessions/:id/events - Log events batch
proctoringRouter.post(
  '/sessions/:id/events',
  validate(BatchEventsSchema),
  asyncHandler(async (req, res) => {
    const result = await proctoringService.logProctoringEvents(
      req.params.id as string,
      req.body.events,
      req.user!.userId
    );
    ok(res, result);
  })
);

// 3. POST /api/v1/proctoring/sessions/:id/heartbeat - Record heartbeat
proctoringRouter.post(
  '/sessions/:id/heartbeat',
  asyncHandler(async (req, res) => {
    const session = await proctoringService.updateHeartbeat(req.params.id as string, req.user!.userId);
    ok(res, session);
  })
);

// 4. POST /api/v1/proctoring/sessions/:id/pause - Pause session
proctoringRouter.post(
  '/sessions/:id/pause',
  asyncHandler(async (req, res) => {
    const session = await proctoringService.pauseProctoringSession(req.params.id as string, req.user!.userId);
    ok(res, session);
  })
);

// 5. POST /api/v1/proctoring/sessions/:id/resume - Resume session
proctoringRouter.post(
  '/sessions/:id/resume',
  asyncHandler(async (req, res) => {
    const session = await proctoringService.resumeProctoringSession(req.params.id as string, req.user!.userId);
    ok(res, session);
  })
);

// 6. POST /api/v1/proctoring/sessions/:id/end - End session & trigger risk analysis
proctoringRouter.post(
  '/sessions/:id/end',
  asyncHandler(async (req, res) => {
    const session = await proctoringService.endProctoringSession(req.params.id as string, req.user!.userId);
    ok(res, session);
  })
);

// 7. GET /api/v1/proctoring/sessions/:id/report - Fetch review report (Scoping check for org / owner)
proctoringRouter.get(
  '/sessions/:id/report',
  asyncHandler(async (req, res) => {
    const report = await proctoringService.getProctoringReport(
      req.params.id as string,
      req.user!.role,
      req.user!.orgId,
      req.user!.userId
    );
    ok(res, report);
  })
);

// 8. GET /api/v1/proctoring/applications/:applicationId/report - Fetch report by applicationId
proctoringRouter.get(
  '/applications/:applicationId/report',
  asyncHandler(async (req, res) => {
    const report = await proctoringService.getProctoringReportByApplicationId(
      req.params.applicationId as string,
      req.user!.role,
      req.user!.orgId,
      req.user!.userId
    );
    if (!report) {
      ok(res, null);
    } else {
      ok(res, report);
    }
  })
);

// 9. POST /api/v1/proctoring/violations/:id/review - Review proctoring violation (HR only)
proctoringRouter.post(
  '/violations/:id/review',
  validate(ReviewViolationSchema),
  asyncHandler(async (req, res) => {
    if (req.user!.role !== 'hr') {
      throw forbidden('Access denied: HR role required for violation review');
    }
    const result = await proctoringService.reviewProctoringViolation(
      req.params.id as string,
      req.body.status,
      req.body.review_reason,
      req.user!.userId,
      req.user!.orgId
    );
    ok(res, result);
  })
);
