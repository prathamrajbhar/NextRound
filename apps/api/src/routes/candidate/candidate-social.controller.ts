import { Request, Response, NextFunction } from 'express';
import { SocialSyncRequestSchema } from '@nextround/shared';
import { prisma } from '../../lib/prisma';
import { generateFieldWithGemini } from '../../services/resume-parser.service';
import {
  syncCandidateSocialProfiles,
  persistSocialSyncOutcome,
  listCandidateSocialSyncs,
  deleteCandidateSocialSource,
} from '../../services/social-sync.service';
import { enqueueEmbeddingRebuild } from '../../services/candidate-embedding.service';
import { getCandidateProfileId } from '../../lib/candidate-profile';
import { logger } from '../../lib/logger';

export async function regenerateField(req: Request, res: Response, next: NextFunction) {
  try {
    const {
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
    } = req.body || {};

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
      data: { field, text },
    });
  } catch (error) {
    logger.child('RegenerateField').error('Failed to regenerate profile field:', error);
    return next(error);
  }
}

export async function syncSocial(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const parsed = SocialSyncRequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid sync request' });
    }
    const { githubUrl, linkedinUrl, githubUsername, linkedinUsername, dataConsent } = parsed.data;

    if (!githubUrl && !linkedinUrl && !githubUsername && !linkedinUsername) {
      return res.status(400).json({ success: false, error: 'Provide at least a GitHub or LinkedIn username/profile URL to sync' });
    }

    const candidateId = await getCandidateProfileId(req.user.userId);

    if (!dataConsent) {
      const profile = await prisma.candidateProfile.findUnique({ where: { id: candidateId } });
      if (!profile?.data_consent) {
        return res.status(400).json({
          success: false,
          error: 'Consent is required before fetching or analyzing your public social profiles.',
        });
      }
    } else {
      await prisma.candidateProfile.update({
        where: { id: candidateId },
        data: { data_consent: true, data_consent_at: new Date() },
      });
    }

    const githubInput = githubUrl || githubUsername || undefined;
    const linkedinInput = linkedinUrl || linkedinUsername || undefined;

    const socialData = await syncCandidateSocialProfiles(githubInput, linkedinInput);

    for (const outcome of socialData.syncs) {
      try {
        await persistSocialSyncOutcome(candidateId, outcome);
        logger
          .child('SyncSocial')
          .info(`Persisted ${outcome.source} sync for candidate ${candidateId}: status=${outcome.status}`);
      } catch (persistErr) {
        logger.child('SyncSocial').error(`Failed to persist ${outcome.source} sync outcome for candidate ${candidateId}:`, persistErr);
      }
    }

    const linkedinOutcome = socialData.syncs.find((s) => s.source === 'linkedin');
    const linkedinFailed = Boolean(linkedinInput) && linkedinOutcome && !linkedinOutcome.synced;
    if (linkedinFailed) {
      const reason = linkedinOutcome.reason || 'LinkedIn sync failed.';
      const timedOut = /timed out/i.test(reason);
      const statusCode = linkedinOutcome.status === 'not_found' ? 404 : timedOut ? 504 : 422;
      return res.status(statusCode).json({
        success: false,
        error: reason,
        data: socialData,
      });
    }

    enqueueEmbeddingRebuild(candidateId).catch((error) =>
      logger.child('SyncSocial').error(`Failed to enqueue embedding rebuild for candidate ${candidateId}:`, error)
    );

    return res.json({
      success: true,
      data: socialData,
    });
  } catch (error) {
    logger.child('SyncSocial').error('Failed to sync social profiles:', error);
    return next(error);
  }
}

export async function listSocialSyncs(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const candidateId = await getCandidateProfileId(req.user.userId);
    const syncs = await listCandidateSocialSyncs(candidateId);
    return res.json({ success: true, data: { syncs } });
  } catch (error) {
    return next(error);
  }
}

export async function deleteSocialSource(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { source } = req.params as { source: string };
    if (source !== 'github' && source !== 'linkedin') {
      return res.status(400).json({ success: false, error: 'source must be "github" or "linkedin"' });
    }
    const candidateId = await getCandidateProfileId(req.user.userId);
    await deleteCandidateSocialSource(candidateId, source);
    enqueueEmbeddingRebuild(candidateId).catch((error) =>
      logger.child('DeleteSocial').error(`Failed to enqueue embedding rebuild after removing ${source} for candidate ${candidateId}:`, error)
    );
    return res.json({ success: true, data: { message: `Removed ${source} social data` } });
  } catch (error) {
    return next(error);
  }
}
