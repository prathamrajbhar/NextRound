import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope, rejectOrgIdParam } from '../../middleware/orgScope';
import {
  createOrUpdateOrg,
  getMyOrg,
  getOrgById,
  updateOrg,
} from './organization-profile.controller';
import {
  getOrgSettings,
  updateOrgSettings,
} from './organization-settings.controller';
import {
  getOrgMembers,
  inviteOrgMember,
  removeOrgMember,
} from './organization-members.controller';

export const organizationRouter = Router();

organizationRouter.use(rejectOrgIdParam);

organizationRouter.post('/', authenticate, requireRole('hr'), createOrUpdateOrg);
organizationRouter.get('/me', authenticate, requireRole('hr'), requireOrgScope, getMyOrg);
organizationRouter.get('/:id', authenticate, requireRole('hr'), requireOrgScope, getOrgById);
organizationRouter.patch('/:id', authenticate, requireRole('hr'), requireOrgScope, updateOrg);
organizationRouter.get('/:id/settings', authenticate, requireRole('hr'), requireOrgScope, getOrgSettings);
organizationRouter.patch('/:id/settings', authenticate, requireRole('hr'), requireOrgScope, updateOrgSettings);

organizationRouter.get('/:id/members', authenticate, requireRole('hr'), requireOrgScope, getOrgMembers);
organizationRouter.post('/:id/members/invite', authenticate, requireRole('hr'), requireOrgScope, inviteOrgMember);
organizationRouter.delete('/:id/members/:userId', authenticate, requireRole('hr'), requireOrgScope, removeOrgMember);
