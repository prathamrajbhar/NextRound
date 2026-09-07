import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler, validate } from '../../lib/http';
import {
  CreateProctoringSessionSchema,
  BatchEventsSchema,
  ReviewViolationSchema,
  RecordingUploadSchema,
  EvidenceUploadSchema,
} from '../../validators/proctoring.schemas';
import { handleRecordingUpload, handleEvidenceUpload } from './proctoring.upload';
import {
  createSession,
  logBatchEvents,
  sendHeartbeat,
  pauseSession,
  resumeSession,
  endSession,
  uploadRecording,
  uploadEvidence,
  getSessionReport,
  getApplicationReport,
  reviewViolation,
} from './proctoring.controller';

export const proctoringRouter = Router();

proctoringRouter.use(authenticate);

proctoringRouter.post('/sessions', validate(CreateProctoringSessionSchema), asyncHandler(createSession));
proctoringRouter.post('/sessions/:id/events', validate(BatchEventsSchema), asyncHandler(logBatchEvents));
proctoringRouter.post('/sessions/:id/heartbeat', asyncHandler(sendHeartbeat));
proctoringRouter.post('/sessions/:id/pause', asyncHandler(pauseSession));
proctoringRouter.post('/sessions/:id/resume', asyncHandler(resumeSession));
proctoringRouter.post('/sessions/:id/end', asyncHandler(endSession));

proctoringRouter.post(
  '/sessions/:id/recording',
  handleRecordingUpload,
  validate(RecordingUploadSchema),
  asyncHandler(uploadRecording)
);

proctoringRouter.post(
  '/sessions/:id/evidence',
  handleEvidenceUpload,
  validate(EvidenceUploadSchema),
  asyncHandler(uploadEvidence)
);

proctoringRouter.get('/sessions/:id/report', asyncHandler(getSessionReport));
proctoringRouter.get('/applications/:applicationId/report', asyncHandler(getApplicationReport));
proctoringRouter.post('/violations/:id/review', validate(ReviewViolationSchema), asyncHandler(reviewViolation));
