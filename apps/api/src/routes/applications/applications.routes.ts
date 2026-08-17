import { Router, Request } from 'express';
import {
  ApplicationCreateSchema,
  ApplicationStatusOverrideSchema,
  ApplicationScheduleSchema,
} from '@nextround/shared';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope, rejectOrgIdParam } from '../../middleware/orgScope';
import { serializeApplication, serializeApplicationList, serializeOffer } from '../../lib/serializers';
import { asyncHandler, ok, validate } from '../../lib/http';
import * as applicationService from '../../services/application.service';
import type { AppUserCtx } from '../../services/application.service';

export const applicationRouter = Router();

applicationRouter.use(rejectOrgIdParam);

function userCtx(req: Request): AppUserCtx {
  const u = req.user!;
  return { userId: u.userId, role: u.role, orgId: u.orgId, email: u.email };
}

applicationRouter.post(
  '/',
  authenticate,
  requireRole('candidate'),
  validate(ApplicationCreateSchema),
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.applyToJob(userCtx(req), req.body), 201);
  })
);

applicationRouter.get(
  '/my',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    const applications = await applicationService.listCandidateApplications(req.user!.userId);
    if (applications === null) {
      return ok(res, { applications: [] });
    }
    return ok(res, serializeApplicationList(applications));
  })
);

applicationRouter.get(
  '/',
  authenticate,
  requireRole('hr'),
  asyncHandler(async (req, res) => {
    const orgId = req.user!.orgId!;
    const jobId = req.query.jobId as string | undefined;
    ok(res, serializeApplicationList(await applicationService.listOrgApplications(orgId, jobId)));
  })
);

applicationRouter.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { application, scheduledSlots } = await applicationService.getApplication(
      req.params.id as string,
      userCtx(req)
    );
    ok(res, serializeApplication(application, { scheduledSlots }));
  })
);

applicationRouter.post(
  '/:id/run-screening',
  authenticate,
  asyncHandler(async (req, res) => {
    const { application: updatedApp, evaluation } = await applicationService.runScreening(
      req.params.id as string,
      userCtx(req)
    );
    ok(res, { application: serializeApplication(updatedApp), evaluation });
  })
);

applicationRouter.patch(
  '/:id/status',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  validate(ApplicationStatusOverrideSchema),
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.overrideStatus(req.params.id as string, req.user!.orgId!, req.body));
  })
);

applicationRouter.patch(
  '/:id',
  authenticate,
  requireRole('hr'),
  requireOrgScope,
  asyncHandler(async (req, res) => {
    const { application } = await applicationService.advanceStage(
      req.params.id as string,
      req.user!.orgId!,
      req.body
    );
    ok(res, serializeApplication(application));
  })
);

applicationRouter.post(
  '/:id/schedule',
  authenticate,
  validate(ApplicationScheduleSchema),
  asyncHandler(async (req, res) => {
    ok(
      res,
      await applicationService.scheduleInterview(req.params.id as string, userCtx(req), req.body)
    );
  })
);

applicationRouter.post(
  '/:id/withdraw',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.withdrawApplication(req.params.id as string, req.user!.userId));
  })
);

applicationRouter.get(
  '/:id/assessment/aptitude/chunk',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    const chunkIndex = Math.max(0, parseInt(req.query.chunkIndex as string, 10) || 0);
    const chunkSize = Math.max(1, Math.min(10, parseInt(req.query.chunkSize as string, 10) || 3));
    ok(
      res,
      await applicationService.getAptitudeChunk(req.params.id as string, req.user!.userId, {
        chunkIndex,
        chunkSize,
      })
    );
  })
);

applicationRouter.post(
  '/:id/assessment/aptitude/chunk',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    ok(
      res,
      await applicationService.submitAptitudeChunk(req.params.id as string, req.user!.userId, req.body)
    );
  })
);

applicationRouter.get(
  '/:id/assessment/aptitude',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.getAptitudeAssessment(req.params.id as string, req.user!.userId));
  })
);

applicationRouter.post(
  '/:id/assessment/aptitude',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    const data = await applicationService.submitAptitude(req.params.id as string, req.user!.userId, req.body);

    res.json({ success: true, data });
  })
);

applicationRouter.get(
  '/:id/assessment/coding',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.getCodingAssessment(req.params.id as string, req.user!.userId));
  })
);

applicationRouter.post(
  '/:id/assessment/coding',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.submitCoding(req.params.id as string, req.user!.userId, req.body));
  })
);

applicationRouter.get(
  '/:id/assessment/coding/:submissionId',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.getCodingSubmission(req.params.submissionId as string));
  })
);

applicationRouter.post(
  '/:id/reschedule',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    const data = await applicationService.requestReschedule(req.params.id as string, req.user!.userId);
    res.json({ success: true, ...data });
  })
);

applicationRouter.get(
  '/offer/token/:token',
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.getOfferByToken(req.params.token as string));
  })
);

applicationRouter.get(
  '/:id/offer',
  authenticate,
  asyncHandler(async (req, res) => {
    const { application, offer } = await applicationService.getApplicationOffer(
      req.params.id as string,
      userCtx(req)
    );
    ok(res, serializeOffer(offer, application));
  })
);

applicationRouter.post(
  '/:id/offer/sign',
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    ok(
      res,
      await applicationService.signOffer(req.params.id as string, req.body, req.user ? userCtx(req) : null)
    );
  })
);

applicationRouter.post(
  '/:id/offer/decline',
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    ok(
      res,
      await applicationService.declineOffer(
        req.params.id as string,
        req.body,
        req.user ? userCtx(req) : null
      )
    );
  })
);
