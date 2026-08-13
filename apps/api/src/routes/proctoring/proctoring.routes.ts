import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler, ok, validate } from '../../lib/http';
import { forbidden } from '../../lib/http-errors';
import { CreateProctoringSessionSchema, BatchEventsSchema, ReviewViolationSchema } from '../../validators/proctoring.schemas';
import * as proctoringService from '../../services/proctoring.service';

export const proctoringRouter = Router();


proctoringRouter.use(authenticate);


proctoringRouter.post(
  '/sessions',
  validate(CreateProctoringSessionSchema),
  asyncHandler(async (req, res) => {
    const session = await proctoringService.createProctoringSession(req.body, req.user!.userId);
    ok(res, session, 201);
  })
);


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


proctoringRouter.post(
  '/sessions/:id/heartbeat',
  asyncHandler(async (req, res) => {
    const session = await proctoringService.updateHeartbeat(req.params.id as string, req.user!.userId);
    ok(res, session);
  })
);


proctoringRouter.post(
  '/sessions/:id/pause',
  asyncHandler(async (req, res) => {
    const session = await proctoringService.pauseProctoringSession(req.params.id as string, req.user!.userId);
    ok(res, session);
  })
);


proctoringRouter.post(
  '/sessions/:id/resume',
  asyncHandler(async (req, res) => {
    const session = await proctoringService.resumeProctoringSession(req.params.id as string, req.user!.userId);
    ok(res, session);
  })
);


proctoringRouter.post(
  '/sessions/:id/end',
  asyncHandler(async (req, res) => {
    const session = await proctoringService.endProctoringSession(req.params.id as string, req.user!.userId);
    ok(res, session);
  })
);


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
      req.user!.orgId ?? null
    );
    ok(res, result);
  })
);
