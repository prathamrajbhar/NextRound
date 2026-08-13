import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { CandidateProfileSchema } from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { uploadFile } from '../../lib/storage';
import { extractTextFromBuffer, parseResumeWithGemini, generateFieldWithGemini } from '../../services/resume-parser.service';
import { syncCandidateSocialProfiles } from '../../services/social-sync.service';

export const candidateProfileRouter = Router();

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, 
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


candidateProfileRouter.post(
  '/regenerate-field',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { field, rawResumeText, socialData, linkedinUrl, githubUrl, portfolioUrl, skills, targetRoles, yearsOfExperience, currentValue } = req.body || {};

      if (!field || !['proudProject', 'bio', 'headline'].includes(field)) {
        return res.status(400).json({ success: false, error: 'Valid field ("proudProject", "bio", "headline") is required' });
      }

      const text = await generateFieldWithGemini({
        field,
        rawResumeText,
        socialData,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        skills,
        targetRoles,
        yearsOfExperience,
        currentValue,
      });

      return res.json({
        success: true,
        data: {
          field,
          text,
        },
      });
    } catch (err) {
      console.error('[RegenerateField] Processing error:', err);
      return next(err);
    }
  }
);


candidateProfileRouter.post(
  '/sync-social',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { githubUrl, linkedinUrl } = req.body || {};
      if (!githubUrl && !linkedinUrl) {
        return res.status(400).json({ success: false, error: 'Provide at least a githubUrl or linkedinUrl to sync' });
      }

      const socialData = await syncCandidateSocialProfiles(githubUrl, linkedinUrl);

      
      
      
      
      const linkedinFailed = Boolean(linkedinUrl) && socialData.linkedin?.synced === false;
      if (linkedinFailed) {
        const reason = socialData.linkedin?.reason || 'LinkedIn sync failed.';
        const timedOut = /timed out/i.test(reason);
        const statusCode = socialData.linkedin?.status === 'not_found' ? 404 : timedOut ? 504 : 422;
        return res.status(statusCode).json({
          success: false,
          error: reason,
        });
      }

      return res.json({
        success: true,
        data: socialData,
      });
    } catch (err) {
      console.error('[SyncSocial] Processing error:', err);
      return next(err);
    }
  }
);


candidateProfileRouter.post(
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
      let extractedRawText: string | undefined = undefined;
      let extractedParsedResume: Record<string, unknown> | undefined = undefined;

      if (req.file) {
        const fileKey = `resumes/${req.user.userId}/${Date.now()}-${req.file.originalname}`;
        resumeUrl = await uploadFile(fileKey, req.file.buffer, req.file.mimetype);

        try {
          extractedRawText = await extractTextFromBuffer(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname
          );
          if (extractedRawText) {
            extractedParsedResume = (await parseResumeWithGemini(extractedRawText)) as unknown as Record<string, unknown>;
          }
        } catch (extractErr) {
          console.error('Failed auto-extracting text on profile upload:', extractErr);
        }
      }

      let bodyData = req.body;
      if (typeof req.body.data === 'string') {
        try {
          bodyData = JSON.parse(req.body.data);
        } catch (e) {
          
        }
      }

      const validated = CandidateProfileSchema.parse(bodyData);

      
      
      const bodyHas = (key: string) => Object.prototype.hasOwnProperty.call(bodyData, key);

      const profile = await prisma.candidateProfile.upsert({
        where: { user_id: req.user.userId },
        create: {
          user_id: req.user.userId,
          full_name: validated.fullName,
          headline: validated.headline,
          phone: validated.phone,
          location: validated.location,
          timezone: validated.timezone,
          linkedin_url: validated.linkedinUrl,
          github_url: validated.githubUrl,
          portfolio_url: validated.portfolioUrl,
          bio: validated.bio,
          skills: validated.skills,
          target_roles: validated.targetRoles,
          years_of_experience: validated.yearsOfExperience,
          work_mode: validated.workMode,
          current_ctc: validated.currentCtc,
          target_locations: validated.targetLocations,
          expected_salary: validated.expectedSalary,
          notice_period: validated.noticePeriod,
          work_authorization: validated.workAuthorization,
          proud_project: validated.proudProject,
          work_values: validated.workValues,
          availability: validated.availability,
          resume_url: resumeUrl || validated.resumeUrl,
          raw_resume_text: validated.rawResumeText || extractedRawText,
          parsed_resume: validated.parsedResume || extractedParsedResume || {},
          social_data: (validated as any).socialData || {},
        },
        update: {
          ...(bodyHas('fullName') && validated.fullName !== undefined ? { full_name: validated.fullName } : {}),
          ...(bodyHas('headline') && validated.headline !== undefined ? { headline: validated.headline } : {}),
          ...(bodyHas('phone') && validated.phone !== undefined ? { phone: validated.phone } : {}),
          ...(bodyHas('location') && validated.location !== undefined ? { location: validated.location } : {}),
          ...(bodyHas('timezone') && validated.timezone !== undefined ? { timezone: validated.timezone } : {}),
          ...(bodyHas('linkedinUrl') && validated.linkedinUrl !== undefined ? { linkedin_url: validated.linkedinUrl } : {}),
          ...(bodyHas('githubUrl') && validated.githubUrl !== undefined ? { github_url: validated.githubUrl } : {}),
          ...(bodyHas('portfolioUrl') && validated.portfolioUrl !== undefined ? { portfolio_url: validated.portfolioUrl } : {}),
          ...(bodyHas('bio') && validated.bio !== undefined ? { bio: validated.bio } : {}),
          ...(bodyHas('skills') ? { skills: validated.skills } : {}),
          ...(bodyHas('targetRoles') ? { target_roles: validated.targetRoles } : {}),
          ...(bodyHas('yearsOfExperience') && validated.yearsOfExperience !== undefined ? { years_of_experience: validated.yearsOfExperience } : {}),
          ...(bodyHas('workMode') && validated.workMode !== undefined ? { work_mode: validated.workMode } : {}),
          ...(bodyHas('currentCtc') && validated.currentCtc !== undefined ? { current_ctc: validated.currentCtc } : {}),
          ...(bodyHas('targetLocations') ? { target_locations: validated.targetLocations } : {}),
          ...(bodyHas('expectedSalary') && validated.expectedSalary !== undefined ? { expected_salary: validated.expectedSalary } : {}),
          ...(bodyHas('noticePeriod') && validated.noticePeriod !== undefined ? { notice_period: validated.noticePeriod } : {}),
          ...(bodyHas('workAuthorization') && validated.workAuthorization !== undefined ? { work_authorization: validated.workAuthorization } : {}),
          ...(bodyHas('proudProject') && validated.proudProject !== undefined ? { proud_project: validated.proudProject } : {}),
          ...(bodyHas('workValues') ? { work_values: validated.workValues } : {}),
          ...(bodyHas('availability') ? { availability: validated.availability } : {}),
          ...(resumeUrl || (bodyHas('resumeUrl') && validated.resumeUrl) ? { resume_url: resumeUrl || validated.resumeUrl } : {}),
          ...(extractedRawText || (bodyHas('rawResumeText') && validated.rawResumeText) ? { raw_resume_text: validated.rawResumeText || extractedRawText } : {}),
          ...(extractedParsedResume || (bodyHas('parsedResume') && validated.parsedResume) ? { parsed_resume: validated.parsedResume || extractedParsedResume } : {}),
          ...(bodyHas('socialData') && (validated as any).socialData ? { social_data: (validated as any).socialData } : {}),
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


candidateProfileRouter.get(
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