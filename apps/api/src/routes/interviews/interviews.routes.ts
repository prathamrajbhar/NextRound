import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { rejectOrgIdParam } from '../../middleware/orgScope';
import {
  endInterview,
  getSessionToken,
  getTranscript,
  recordConsent,
  recordProctoringFlag,
  saveHrResult,
  sendSignal,
  getSignals,
} from './interviews.controller';

export const interviewRouter = Router();

// All routes require authentication.
// Org scoping is always derived from the JWT — never accepted from the client.
interviewRouter.use(authenticate);
interviewRouter.use(rejectOrgIdParam);

interviewRouter.post('/:id/consent', recordConsent);
interviewRouter.post('/:id/session-token', getSessionToken);
interviewRouter.post('/:id/end', endInterview);
interviewRouter.patch('/:id/proctoring', recordProctoringFlag);
interviewRouter.get('/:id/transcript', getTranscript);
interviewRouter.post('/hr/:applicationId/result', requireRole('hr'), saveHrResult);
interviewRouter.post('/:id/signal', sendSignal);
interviewRouter.get('/:id/signals', getSignals);
