import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { getSentimentProfiles, getSentimentProfileById } from './sentiment.controller';

export const sentimentRouter = Router();

sentimentRouter.get('/', authenticate, requireRole('hr'), getSentimentProfiles);
sentimentRouter.get('/:interviewId', authenticate, requireRole('hr'), getSentimentProfileById);
