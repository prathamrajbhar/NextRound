import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { rejectOrgIdParam } from '../../middleware/orgScope';
import { getAnalytics } from './analytics.controller';
import { exportAnalytics } from './analytics-export.controller';

export const analyticsRouter = Router();

analyticsRouter.use(rejectOrgIdParam);

analyticsRouter.get('/', authenticate, requireRole('hr'), getAnalytics);
analyticsRouter.get('/export', authenticate, requireRole('hr'), exportAnalytics);
