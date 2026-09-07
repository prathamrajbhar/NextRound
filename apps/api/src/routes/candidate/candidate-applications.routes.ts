import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  getApplicationOffer,
  getApplicationTakeHome,
  submitApplicationTakeHome,
} from './candidate-applications.controller';
import { getApplicationOnboarding } from './candidate-onboarding.controller';

export const candidateApplicationsRouter = Router();

candidateApplicationsRouter.get('/applications/:id/offer', authenticate, requireRole('candidate'), getApplicationOffer);
candidateApplicationsRouter.get('/applications/:id/onboarding', authenticate, requireRole('candidate'), getApplicationOnboarding);
candidateApplicationsRouter.get('/applications/:id/take-home', authenticate, requireRole('candidate'), getApplicationTakeHome);
candidateApplicationsRouter.post('/applications/:id/take-home/submit', authenticate, requireRole('candidate'), submitApplicationTakeHome);
