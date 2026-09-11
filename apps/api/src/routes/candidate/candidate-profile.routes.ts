import { Router } from 'express';
import multer from 'multer';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  regenerateField,
  syncSocial,
  listSocialSyncs,
  deleteSocialSource,
} from './candidate-social.controller';
import {
  upsertProfile,
  getProfile,
} from './candidate-profile.controller';

export const candidateProfileRouter = Router();

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024,
    fieldSize: 30 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = (file.originalname || '').toLowerCase();
    const isAllowedExt = ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.doc') || ext.endsWith('.txt');
    const isAllowedMime = (file.mimetype || '').includes('pdf') || file.mimetype.includes('document') || file.mimetype.includes('text') || file.mimetype.includes('stream');

    if (isAllowedExt || isAllowedMime || !file.mimetype) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

candidateProfileRouter.post('/regenerate-field', optionalAuthenticate, regenerateField);
candidateProfileRouter.post('/sync-social', authenticate, requireRole('candidate'), syncSocial);
candidateProfileRouter.get('/social/syncs', authenticate, requireRole('candidate'), listSocialSyncs);
candidateProfileRouter.delete('/social/:source', authenticate, requireRole('candidate'), deleteSocialSource);
candidateProfileRouter.post('/profile', authenticate, requireRole('candidate'), upload.single('resume'), upsertProfile);
candidateProfileRouter.get('/profile', authenticate, requireRole('candidate'), getProfile);
