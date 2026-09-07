import { Request, Response, NextFunction } from 'express';
import { CandidateProfileSchema } from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@nextround/database';
import { uploadFile } from '../../lib/storage';
import { extractTextFromBuffer, parseResumeWithGemini } from '../../services/resume/resume-parser.service';
import { enqueueEmbeddingRebuild } from '../../services/candidate/candidate-embedding.service';
import { emailService } from '../../services/email/email.service';
import { logger } from '../../lib/logger';

export async function upsertProfile(req: Request, res: Response, next: NextFunction) {
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
        logger.child('Profile').error(`Failed auto-extracting text on profile upload (${req.file.originalname}):`, extractErr);
      }
    }

    let bodyData = req.body;
    if (typeof req.body.data === 'string') {
      try {
        bodyData = JSON.parse(req.body.data);
      } catch {
        // use raw bodyData
      }
    }

    const validated = CandidateProfileSchema.parse(bodyData);
    const bodyHas = (key: string) => Object.prototype.hasOwnProperty.call(bodyData, key);

    const existingProfile = await prisma.candidateProfile.findUnique({
      where: { user_id: req.user.userId },
      select: { full_name: true },
    });
    const isFirstOnboarding = !existingProfile?.full_name && Boolean(validated.fullName);

    const profile = await prisma.candidateProfile.upsert({
      where: { user_id: req.user.userId },
      create: {
        user_id: req.user.userId,
        full_name: validated.fullName,
        headline: validated.headline,
        phone: validated.phone,
        location: validated.location,
        timezone: validated.timezone,
        avatar_url: validated.avatarUrl,
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
        availability: (validated.availability as Prisma.InputJsonValue) || undefined,
        resume_url: resumeUrl || validated.resumeUrl,
        raw_resume_text: validated.rawResumeText || extractedRawText,
        parsed_resume: ((validated.parsedResume || extractedParsedResume || {}) as Prisma.InputJsonValue),
        social_data: (((validated as Record<string, unknown>).socialData || {}) as Prisma.InputJsonValue),
        data_consent: validated.dataConsent || false,
        data_consent_at: validated.consentAt
          ? new Date(validated.consentAt)
          : validated.dataConsent
          ? new Date()
          : null,
      },
      update: {
        ...(bodyHas('fullName') && validated.fullName !== undefined ? { full_name: validated.fullName } : {}),
        ...(bodyHas('headline') && validated.headline !== undefined ? { headline: validated.headline } : {}),
        ...(bodyHas('phone') && validated.phone !== undefined ? { phone: validated.phone } : {}),
        ...(bodyHas('location') && validated.location !== undefined ? { location: validated.location } : {}),
        ...(bodyHas('timezone') && validated.timezone !== undefined ? { timezone: validated.timezone } : {}),
        ...(bodyHas('avatarUrl') && validated.avatarUrl !== undefined ? { avatar_url: validated.avatarUrl } : {}),
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
        ...(bodyHas('availability') ? { availability: (validated.availability as Prisma.InputJsonValue) || undefined } : {}),
        ...(resumeUrl || (bodyHas('resumeUrl') && validated.resumeUrl) ? { resume_url: resumeUrl || validated.resumeUrl } : {}),
        ...(extractedRawText || (bodyHas('rawResumeText') && validated.rawResumeText) ? { raw_resume_text: validated.rawResumeText || extractedRawText } : {}),
        ...(extractedParsedResume || (bodyHas('parsedResume') && validated.parsedResume) ? { parsed_resume: ((validated.parsedResume || extractedParsedResume) as Prisma.InputJsonValue) } : {}),
        ...(bodyHas('socialData') && (validated as Record<string, unknown>).socialData ? { social_data: ((validated as Record<string, unknown>).socialData as Prisma.InputJsonValue) } : {}),
        ...(bodyHas('dataConsent') ? { data_consent: validated.dataConsent ?? false } : {}),
        ...(bodyHas('dataConsent') && validated.dataConsent ? { data_consent_at: new Date() } : {}),
      },
    });

    if (profile.data_consent) {
      enqueueEmbeddingRebuild(profile.id).catch((error) =>
        logger.child('Profile').error(`Failed to enqueue embedding rebuild for candidate ${profile.id}:`, error)
      );
    }

    if (isFirstOnboarding && req.user?.email) {
      const candidateEmail = req.user.email;
      const candidateName = profile.full_name || candidateEmail.split('@')[0];
      emailService
        .sendWelcomeCandidate(candidateEmail, candidateName)
        .catch((emailErr) =>
          logger.child('Profile').error(`Failed to dispatch candidate welcome email to ${candidateEmail}:`, emailErr)
        );
    }

    return res.json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
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
  } catch (error) {
    return next(error);
  }
}
