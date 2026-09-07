import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { TalentBookmarkCreateSchema, TalentOutreachSchema } from '@nextround/shared';
import { notificationService } from '../../services/notification/notification.service';
import { env } from '../../lib/env';

export async function createBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.orgId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
    }

    const parsed = TalentBookmarkCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid payload' });
    }

    const { candidateId, jobId, notes } = parsed.data;

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateId },
    });
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate profile not found' });
    }

    const bookmark = await prisma.talentBookmark.upsert({
      where: {
        org_id_candidate_id: {
          org_id: orgId,
          candidate_id: candidateId,
        },
      },
      create: {
        org_id: orgId,
        candidate_id: candidateId,
        job_id: jobId || null,
        notes: notes || null,
      },
      update: {
        job_id: jobId || null,
        notes: notes || null,
      },
    });

    return res.status(201).json({
      success: true,
      data: { bookmark },
    });
  } catch (error) {
    return next(error);
  }
}

export async function listBookmarks(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.orgId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
    }

    const bookmarks = await prisma.talentBookmark.findMany({
      where: { org_id: orgId },
      include: {
        candidate: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
        job: { select: { id: true, title: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({
      success: true,
      data: { bookmarks },
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.orgId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
    }
    const bookmarkId = req.params.id as string;

    const existing = await prisma.talentBookmark.findFirst({
      where: { id: bookmarkId, org_id: orgId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Bookmark not found' });
    }

    await prisma.talentBookmark.delete({
      where: { id: bookmarkId },
    });

    return res.json({
      success: true,
      data: { message: 'Bookmark removed successfully' },
    });
  } catch (error) {
    return next(error);
  }
}

export async function sendOutreach(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.orgId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
    }

    const parsed = TalentOutreachSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid payload' });
    }

    const { candidateId, subject, body } = parsed.data;

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateId },
      include: { user: true },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate profile not found' });
    }

    await notificationService.createNotification(
      candidate.user.id,
      `New Opportunity Outreach: ${subject}`,
      body,
      'info'
    );

    return res.json({
      success: true,
      data: {
        candidateId,
        sentTo: candidate.user.email,
        subject,
        deliveredAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function externalSource(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.orgId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
    }

    const { github_id, linkedin_id, target_role, job_description } = req.body || {};
    if (!github_id && !linkedin_id) {
      return res.status(400).json({ success: false, error: 'At least one of github_id or linkedin_id must be provided.' });
    }

    const aiServiceUrl = env('AI_BASE_URL');
    const aiResp = await fetch(`${aiServiceUrl}/api/v1/ai/sourcing/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        github_id,
        linkedin_id,
        target_role,
        job_description,
      }),
    });

    if (!aiResp.ok) {
      const errorText = await aiResp.text();
      return res.status(aiResp.status).json({ success: false, error: `External sourcing failed: ${errorText}` });
    }

    const data = await aiResp.json();
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
}
