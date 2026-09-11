import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  listResumeHistory,
  getResumeResult,
  deleteResumeSession,
} from './resume-builder.controller';
import {
  createResumeSession,
  getResumeSession,
  endResumeSession,
} from './resume-session.controller';

export const resumeBuilderRouter = Router();

resumeBuilderRouter.get('/history', authenticate, requireRole('candidate'), listResumeHistory);
resumeBuilderRouter.post('/sessions', authenticate, requireRole('candidate'), createResumeSession);
resumeBuilderRouter.get('/:sessionId', authenticate, requireRole('candidate'), getResumeSession);
resumeBuilderRouter.post('/:sessionId/end', authenticate, requireRole('candidate'), endResumeSession);
resumeBuilderRouter.get('/:sessionId/result', authenticate, requireRole('candidate'), getResumeResult);
resumeBuilderRouter.delete('/:sessionId', authenticate, requireRole('candidate'), deleteResumeSession);
