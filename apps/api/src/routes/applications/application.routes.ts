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

// Org scoping is JWT-derived; never accept a client-supplied org_id.
applicationRouter.use(rejectOrgIdParam);

/** Snapshot the authenticated user's identity for the HTTP-free service layer. */
function userCtx(req: Request): AppUserCtx {
  const u = req.user!;
  return { userId: u.userId, role: u.role, orgId: u.orgId, email: u.email };
}

// POST /api/v1/applications - Candidate submit application
applicationRouter.post(
  '/',
  authenticate,
  requireRole('candidate'),
  validate(ApplicationCreateSchema),
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.applyToJob(userCtx(req), req.body), 201);
  })
);

// GET /api/v1/applications/my - Candidate get own applications
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

// GET /api/v1/applications - HR list applications (optionally filtered by ?jobId)
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

// GET /api/v1/applications/:id - Fetch single application details
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

// POST /api/v1/applications/:id/run-screening - Run or re-run AI screening evaluation
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

// PATCH /api/v1/applications/:id/status - HR override stage status
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

// PATCH /api/v1/applications/:id - HR advance candidate stage (Kanban). Maps stage name to status.
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

// POST /api/v1/applications/:id/schedule - Schedule HR round / voice interview
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

// POST /api/v1/applications/:id/withdraw - Candidate withdraw application
applicationRouter.post(
  '/:id/withdraw',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.withdrawApplication(req.params.id as string, req.user!.userId));
  })
);

// GET /api/v1/applications/:id/assessment/aptitude/chunk - Fetch progressive AI aptitude chunk
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

// POST /api/v1/applications/:id/assessment/aptitude/chunk - Submit current chunk & fetch next chunk
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

// GET /api/v1/applications/:id/assessment/aptitude - Fetch dynamic LLM aptitude test questions
applicationRouter.get(
  '/:id/assessment/aptitude',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.getAptitudeAssessment(req.params.id as string, req.user!.userId));
  })
);

// POST /api/v1/applications/:id/assessment/aptitude - Submit aptitude assessment answers
// NOTE: keeps the legacy top-level score fields (not the data envelope) because
// the web client reads res.score directly (AptitudeTestConsole).
applicationRouter.post(
  '/:id/assessment/aptitude',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    const data = await applicationService.submitAptitude(req.params.id as string, req.user!.userId, req.body);
    // Wrap in data envelope so apiClient.post() can return res.score correctly
    res.json({ success: true, data });
  })
);

// GET /api/v1/applications/:id/assessment/coding - Fetch coding problem
applicationRouter.get(
  '/:id/assessment/coding',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.getCodingAssessment(req.params.id as string, req.user!.userId));
  })
);

// POST /api/v1/applications/:id/assessment/coding - Submit candidate code
applicationRouter.post(
  '/:id/assessment/coding',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.submitCoding(req.params.id as string, req.user!.userId, req.body));
  })
);

// GET /api/v1/applications/:id/assessment/coding/:submissionId - Poll submission status
applicationRouter.get(
  '/:id/assessment/coding/:submissionId',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.getCodingSubmission(req.params.submissionId as string));
  })
);

// POST /api/v1/applications/:id/reschedule - Reschedule interview request
// NOTE: legacy top-level message shape (no data envelope) preserved as-is.
applicationRouter.post(
  '/:id/reschedule',
  authenticate,
  requireRole('candidate'),
  asyncHandler(async (req, res) => {
    const data = await applicationService.requestReschedule(req.params.id as string, req.user!.userId);
    res.json({ success: true, ...data });
  })
);

// GET /api/v1/applications/offer/token/:token - Get offer by magic link token
applicationRouter.get(
  '/offer/token/:token',
  asyncHandler(async (req, res) => {
    ok(res, await applicationService.getOfferByToken(req.params.token as string));
  })
);

// GET /api/v1/applications/:id/offer - Fetch application offer details
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

// POST /api/v1/applications/:id/offer/sign - Digitally sign offer
// Auth: authenticated candidate owner OR a valid magic_link_token (from the emailed link)
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

// POST /api/v1/applications/:id/offer/decline - Candidate declines offer
// Auth: authenticated candidate owner OR a valid magic_link_token (from the emailed link)
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
