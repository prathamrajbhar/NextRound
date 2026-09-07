import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { rejectOrgIdParam } from '../../middleware/orgScope';
import { searchTalentPool } from './talent-pool-search.controller';
import {
  createBookmark,
  listBookmarks,
  deleteBookmark,
  sendOutreach,
  externalSource,
} from './talent-pool-actions.controller';

export const talentPoolRouter = Router();

talentPoolRouter.use(rejectOrgIdParam);

talentPoolRouter.get('/', authenticate, requireRole('hr'), searchTalentPool);
talentPoolRouter.post('/bookmarks', authenticate, requireRole('hr'), createBookmark);
talentPoolRouter.get('/bookmarks', authenticate, requireRole('hr'), listBookmarks);
talentPoolRouter.delete('/bookmarks/:id', authenticate, requireRole('hr'), deleteBookmark);
talentPoolRouter.post('/outreach', authenticate, requireRole('hr'), sendOutreach);
talentPoolRouter.post('/external-source', authenticate, requireRole('hr'), externalSource);
