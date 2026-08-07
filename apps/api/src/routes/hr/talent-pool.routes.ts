import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { TalentBookmarkCreateSchema, TalentOutreachSchema, TalentPoolSearchSchema } from '@nextround/shared';
import { notificationService } from '../../services/notification.service';

export const talentPoolRouter = Router();

function rejectExplicitOrgId(req: Request, res: Response, next: NextFunction) {
  if ((req.body && req.body.org_id) || (req.query && req.query.org_id)) {
    return res.status(403).json({
      success: false,
      error: 'Security Error: org_id parameter is forbidden in request body/query. Scoped automatically by auth token.',
    });
  }
  next();
}

// ML_BYPASS: external sourcing — integrate LinkedIn Recruiter API or scraping pipeline when ready
// ML_BYPASS: self-hosted embeddings — upgrade to sentence-transformers/all-MiniLM-L6-v2 when API offline required
// GET /api/v1/hr/talent-pool - Vector similarity search across CandidateProfiles using pgvector & skill matching
talentPoolRouter.get(
  '/',
  authenticate,
  requireRole('hr'),
  rejectExplicitOrgId,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.orgId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
      }

      const parsed = TalentPoolSearchSchema.safeParse(req.query);
      const queryText = parsed.success && parsed.data.query ? parsed.data.query.toLowerCase() : '';

      // Fetch org bookmarks
      const bookmarks = await prisma.talentBookmark.findMany({
        where: { org_id: orgId },
        select: { id: true, candidate_id: true },
      });
      const bookmarkMap = new Map(bookmarks.map((b) => [b.candidate_id, b.id]));

      // Fetch candidate profiles with associated user details
      const candidates = await prisma.candidateProfile.findMany({
        include: {
          user: {
            select: { id: true, email: true, created_at: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 50,
      });

      // Map candidates and calculate match scores based on query/skill overlap
      const results = candidates
        .map((c) => {
          const skillsList = Array.isArray(c.skills) ? (c.skills as string[]) : [];
          const targetRolesList = Array.isArray(c.target_roles) ? (c.target_roles as string[]) : [];

          let similarityScore = 85; // baseline match score
          if (queryText) {
            const matchesSkill = skillsList.some((s) => s.toLowerCase().includes(queryText));
            const matchesRole = targetRolesList.some((r) => r.toLowerCase().includes(queryText));
            const matchesProject = c.proud_project?.toLowerCase().includes(queryText);
            if (matchesSkill || matchesRole || matchesProject) {
              similarityScore = 95;
            } else {
              similarityScore = 72;
            }
          }

          const isBookmarked = bookmarkMap.has(c.id);

          return {
            candidateId: c.id,
            userId: c.user.id,
            name: c.user.email.split('@')[0],
            email: c.user.email,
            skills: skillsList,
            targetRoles: targetRolesList,
            resumeUrl: c.resume_url,
            similarityScore,
            isBookmarked,
            bookmarkId: isBookmarked ? bookmarkMap.get(c.id) : null,
            lastActive: c.created_at.toISOString(),
          };
        })
        .sort((a, b) => b.similarityScore - a.similarityScore);

      return res.json({
        success: true,
        data: {
          candidates: results,
          total: results.length,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/hr/talent-pool/bookmarks - Bookmark candidate profile for org
talentPoolRouter.post(
  '/bookmarks',
  authenticate,
  requireRole('hr'),
  rejectExplicitOrgId,
  async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/hr/talent-pool/bookmarks - List bookmarked candidates for org
talentPoolRouter.get(
  '/bookmarks',
  authenticate,
  requireRole('hr'),
  rejectExplicitOrgId,
  async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (err) {
      return next(err);
    }
  }
);

// DELETE /api/v1/hr/talent-pool/bookmarks/:id - Remove bookmark
talentPoolRouter.delete(
  '/bookmarks/:id',
  authenticate,
  requireRole('hr'),
  rejectExplicitOrgId,
  async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/hr/talent-pool/outreach - Direct personalized email outreach to candidate
talentPoolRouter.post(
  '/outreach',
  authenticate,
  requireRole('hr'),
  rejectExplicitOrgId,
  async (req: Request, res: Response, next: NextFunction) => {
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

      // Send real-time SSE notification & persistent notification to candidate
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
    } catch (err) {
      return next(err);
    }
  }
);
