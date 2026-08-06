import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { CandidateProfileSchema } from '@nextround/shared';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { uploadFile } from '../lib/s3';

export const candidateRouter = Router();

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.includes('document')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF or document files are allowed'));
    }
  },
});

// POST /api/v1/candidate/profile - Create or update candidate profile with optional resume upload
candidateRouter.post(
  '/profile',
  authenticate,
  requireRole('candidate'),
  upload.single('resume'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      let resumeUrl: string | undefined = undefined;

      if (req.file) {
        const fileKey = `resumes/${req.user.userId}/${Date.now()}-${req.file.originalname}`;
        resumeUrl = await uploadFile(fileKey, req.file.buffer, req.file.mimetype);
      }

      let bodyData = req.body;
      if (typeof req.body.data === 'string') {
        try {
          bodyData = JSON.parse(req.body.data);
        } catch (e) {
          // keep bodyData as is
        }
      }

      const validated = CandidateProfileSchema.parse(bodyData);

      const profile = await prisma.candidateProfile.upsert({
        where: { user_id: req.user.userId },
        create: {
          user_id: req.user.userId,
          skills: validated.skills,
          target_roles: validated.targetRoles,
          expected_salary: validated.expectedSalary,
          notice_period: validated.noticePeriod,
          work_authorization: validated.workAuthorization,
          proud_project: validated.proudProject,
          work_values: validated.workValues,
          resume_url: resumeUrl || validated.resumeUrl,
        },
        update: {
          skills: validated.skills,
          target_roles: validated.targetRoles,
          expected_salary: validated.expectedSalary,
          notice_period: validated.noticePeriod,
          work_authorization: validated.workAuthorization,
          proud_project: validated.proudProject,
          work_values: validated.workValues,
          resume_url: resumeUrl || validated.resumeUrl || undefined,
        },
      });

      return res.json({
        success: true,
        data: { profile },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/candidate/profile - Get candidate profile
candidateRouter.get(
  '/profile',
  authenticate,
  requireRole('candidate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const profile = await prisma.candidateProfile.findUnique({
        where: { user_id: req.user.userId },
      });

      if (!profile) {
        return res.status(404).json({ success: false, error: 'Candidate profile not found' });
      }

      return res.json({
        success: true,
        data: { profile },
      });
    } catch (err) {
      return next(err);
    }
  }
);
