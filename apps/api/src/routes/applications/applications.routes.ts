import { Router } from 'express';
import {
  ApplicationCreateSchema,
  ApplicationStatusOverrideSchema,
  ApplicationScheduleSchema,
} from '@nextround/shared';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope, rejectOrgIdParam } from '../../middleware/orgScope';
import { asyncHandler, validate } from '../../lib/http';
import {
  applyToJob,
  listMyApplications,
  listOrgApplications,
  getApplication,
  runScreening,
  overrideStatus,
  advanceStage,
  scheduleInterview,
  withdrawApplication,
  requestReschedule,
} from './applications.controller';
import {
  getAptitudeChunk,
  submitAptitudeChunk,
  getAptitudeAssessment,
  submitAptitude,
  getCodingAssessment,
  submitCoding,
  getCodingSubmission,
} from './applications-assessment.controller';
import {
  getOfferByToken,
  getApplicationOffer,
  signOffer,
  declineOffer,
} from './applications-offer.controller';

export const applicationRouter = Router();

applicationRouter.use(rejectOrgIdParam);

applicationRouter.post('/', authenticate, requireRole('candidate'), validate(ApplicationCreateSchema), asyncHandler(applyToJob));
applicationRouter.get('/my', authenticate, requireRole('candidate'), asyncHandler(listMyApplications));
applicationRouter.get('/', authenticate, requireRole('hr'), asyncHandler(listOrgApplications));
applicationRouter.get('/:id', authenticate, asyncHandler(getApplication));
applicationRouter.post('/:id/run-screening', authenticate, asyncHandler(runScreening));
applicationRouter.patch('/:id/status', authenticate, requireRole('hr'), requireOrgScope, validate(ApplicationStatusOverrideSchema), asyncHandler(overrideStatus));
applicationRouter.patch('/:id', authenticate, requireRole('hr'), requireOrgScope, asyncHandler(advanceStage));
applicationRouter.post('/:id/schedule', authenticate, validate(ApplicationScheduleSchema), asyncHandler(scheduleInterview));
applicationRouter.post('/:id/withdraw', authenticate, requireRole('candidate'), asyncHandler(withdrawApplication));

applicationRouter.get('/:id/assessment/aptitude/chunk', authenticate, requireRole('candidate'), asyncHandler(getAptitudeChunk));
applicationRouter.post('/:id/assessment/aptitude/chunk', authenticate, requireRole('candidate'), asyncHandler(submitAptitudeChunk));
applicationRouter.get('/:id/assessment/aptitude', authenticate, requireRole('candidate'), asyncHandler(getAptitudeAssessment));
applicationRouter.post('/:id/assessment/aptitude', authenticate, requireRole('candidate'), asyncHandler(submitAptitude));
applicationRouter.get('/:id/assessment/coding', authenticate, requireRole('candidate'), asyncHandler(getCodingAssessment));
applicationRouter.post('/:id/assessment/coding', authenticate, requireRole('candidate'), asyncHandler(submitCoding));
applicationRouter.get('/:id/assessment/coding/:submissionId', authenticate, asyncHandler(getCodingSubmission));

applicationRouter.post('/:id/reschedule', authenticate, requireRole('candidate'), asyncHandler(requestReschedule));
applicationRouter.get('/offer/token/:token', asyncHandler(getOfferByToken));
applicationRouter.get('/:id/offer', authenticate, asyncHandler(getApplicationOffer));
applicationRouter.post('/:id/offer/sign', optionalAuthenticate, asyncHandler(signOffer));
applicationRouter.post('/:id/offer/decline', optionalAuthenticate, asyncHandler(declineOffer));
