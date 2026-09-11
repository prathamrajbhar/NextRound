import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  getTopics,
  createMockSession,
  listMockSessions,
  getMockSession,
} from './mock-session.controller';
import {
  endMockSession,
  getMockFeedback,
} from './mock-evaluation.controller';
import {
  getMockAptitudeChunk,
  getMockAptitude,
} from './mock-aptitude.controller';
import { getMockCoding } from './mock-coding.controller';

export const mockRouter = Router();

mockRouter.get('/topics', getTopics);
mockRouter.post('/sessions', authenticate, requireRole('candidate'), createMockSession);
mockRouter.get('/sessions', authenticate, requireRole('candidate'), listMockSessions);
mockRouter.get('/sessions/:id', authenticate, requireRole('candidate'), getMockSession);

mockRouter.get('/sessions/:id/aptitude/chunk', authenticate, requireRole('candidate'), getMockAptitudeChunk);
mockRouter.get('/sessions/:id/aptitude', authenticate, requireRole('candidate'), getMockAptitude);
mockRouter.get('/sessions/:id/coding', authenticate, requireRole('candidate'), getMockCoding);

mockRouter.post('/sessions/:id/end', authenticate, requireRole('candidate'), endMockSession);
mockRouter.get('/sessions/:id/feedback', authenticate, requireRole('candidate'), getMockFeedback);
