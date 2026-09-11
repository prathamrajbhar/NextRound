import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { requireOrgScope, rejectOrgIdParam } from '../../middleware/orgScope';
import multer from 'multer';
import {
  createOrUpdateOrg,
  getMyOrg,
  getOrgById,
  updateOrg,
  uploadOrgLogo,
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

const logoUpload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = (file.originalname || '').toLowerCase();
    const isImage = ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.svg') || ext.endsWith('.webp');
    const isMimeImage = (file.mimetype || '').startsWith('image/');
    if (isImage || isMimeImage) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, SVG, WebP) are allowed for company logo'));
    }
  },
});

export const organizationRouter = Router();

organizationRouter.use(rejectOrgIdParam);

organizationRouter.post('/logo', authenticate, requireRole('hr'), logoUpload.single('logo'), uploadOrgLogo);
organizationRouter.post('/', authenticate, requireRole('hr'), createOrUpdateOrg);
organizationRouter.get('/me', authenticate, requireRole('hr'), requireOrgScope, getMyOrg);
organizationRouter.get('/:id', authenticate, requireRole('hr'), requireOrgScope, getOrgById);
organizationRouter.patch('/:id', authenticate, requireRole('hr'), requireOrgScope, updateOrg);
organizationRouter.get('/:id/settings', authenticate, requireRole('hr'), requireOrgScope, getOrgSettings);
organizationRouter.patch('/:id/settings', authenticate, requireRole('hr'), requireOrgScope, updateOrgSettings);

organizationRouter.get('/:id/members', authenticate, requireRole('hr'), requireOrgScope, getOrgMembers);
organizationRouter.post('/:id/members/invite', authenticate, requireRole('hr'), requireOrgScope, inviteOrgMember);
organizationRouter.delete('/:id/members/:userId', authenticate, requireRole('hr'), requireOrgScope, removeOrgMember);
