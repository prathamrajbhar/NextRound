import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { rejectOrgIdParam } from '../../middleware/orgScope';
import { TalentBookmarkCreateSchema, TalentOutreachSchema, TalentPoolSearchSchema } from '@nextround/shared';
import { notificationService } from '../../services/notification.service';
import { env } from '../../lib/env';

export const talentPoolRouter = Router();

talentPoolRouter.use(rejectOrgIdParam);

interface VectorMatchRow {
  candidateId: string;
  userId: string;
  email: string;
  createdAt: Date | string;
  resumeUrl: string | null;
  skills: unknown;
  targetRoles: unknown;
  cosineSimilarity: number | null;
}

interface TalentPoolCandidateResult {
  candidateId: string;
  applicationId: string | null;
  userId: string;
  name: string;
  email: string;
  skills: string[];
  targetRoles: string[];
  resumeUrl: string | null;
  similarityScore: number | null;
  isBookmarked: boolean;
  bookmarkId: string | null;
  lastActive: string;
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function generateQueryEmbedding(queryText: string): Promise<number[] | null> {
  const aiServiceUrl = env('AI_BASE_URL');

  let resp: Awaited<ReturnType<typeof fetch>>;
  try {
    resp = await fetch(`${aiServiceUrl}/api/v1/embeddings/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: queryText }),
    });
  } catch {
    return null;
  }

  if (!resp.ok) {
    return null;
  }

  let body: { data?: { embedding?: unknown; model?: unknown } };
  try {
    body = (await resp.json()) as { data?: { embedding?: unknown; model?: unknown } };
  } catch {
    return null;
  }

  const model = typeof body.data?.model === 'string' ? body.data.model : '';
  if (model.toLowerCase().includes('fallback')) {
    return null;
  }

  const embedding = body.data?.embedding;
  if (!Array.isArray(embedding) || embedding.length !== 768) {
    return null;
  }
  return embedding as number[];
}

talentPoolRouter.get(
  '/',
  authenticate,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user!.orgId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'User does not belong to an organization' });
      }

      const parsed = TalentPoolSearchSchema.safeParse(req.query);
      const queryText = parsed.success && parsed.data.query ? parsed.data.query.toLowerCase() : '';

      const bookmarks = await prisma.talentBookmark.findMany({
        where: { org_id: orgId },
        select: { id: true, candidate_id: true },
      });
      const bookmarkMap = new Map(bookmarks.map((b) => [b.candidate_id, b.id]));

      const applications = await prisma.application.findMany({
        where: {
          job: { org_id: orgId },
        },
        select: { id: true, candidate_id: true, applied_at: true },
        orderBy: { applied_at: 'desc' },
      });
      const appMap = new Map<string, string>();
      for (const app of applications) {
        if (!appMap.has(app.candidate_id)) appMap.set(app.candidate_id, app.id);
      }

      const serialize = (
        candidateId: string,
        userId: string,
        email: string,
        skills: string[],
        targetRoles: string[],
        resumeUrl: string | null,
        createdAt: Date | string,
        similarityScore: number | null
      ): TalentPoolCandidateResult => {
        const isBookmarked = bookmarkMap.has(candidateId);
        return {
          candidateId,
          applicationId: appMap.get(candidateId) ?? null,
          userId,
          name: email.split('@')[0],
          email,
          skills,
          targetRoles,
          resumeUrl: resumeUrl ?? null,
          similarityScore,
          isBookmarked,
          bookmarkId: isBookmarked ? (bookmarkMap.get(candidateId) ?? null) : null,
          lastActive: new Date(createdAt).toISOString(),
        };
      };

      let semanticMatch = false;
      let results: TalentPoolCandidateResult[] = [];

      if (queryText) {
        const queryEmbedding = await generateQueryEmbedding(queryText);
        if (queryEmbedding) {
          const vectorStr = `[${queryEmbedding.join(',')}]`;
          const matches = await prisma.$queryRaw<VectorMatchRow[]>`
            SELECT
              cp.id                    AS "candidateId",
              cp.user_id               AS "userId",
              u.email                  AS "email",
              cp.created_at            AS "createdAt",
              cp.resume_url            AS "resumeUrl",
              cp.skills                AS "skills",
              cp.target_roles          AS "targetRoles",
              (1 - (cp.resume_embedding <=> ${vectorStr}::vector))::float8 AS "cosineSimilarity"
            FROM "CandidateProfile" cp
            JOIN "User" u ON u.id = cp.user_id
            WHERE cp.resume_embedding IS NOT NULL
              AND cp.id IN (
                SELECT candidate_id FROM "Application" a
                JOIN "Job" j ON j.id = a.job_id
                WHERE j.org_id = ${orgId}
              )
            ORDER BY cp.resume_embedding <=> ${vectorStr}::vector ASC
            LIMIT 50
          `;
          semanticMatch = true;
          results = matches.map((m) => {
            const cosine = typeof m.cosineSimilarity === 'number' ? m.cosineSimilarity : null;
            const similarityScore =
              cosine !== null ? Math.min(100, Math.max(0, Math.round(cosine * 1000) / 10)) : null;
            return serialize(
              m.candidateId,
              m.userId,
              m.email,
              toStringList(m.skills),
              toStringList(m.targetRoles),
              m.resumeUrl,
              m.createdAt,
              similarityScore
            );
          });
        }
      }

      if (!semanticMatch) {

        const candidates = await prisma.candidateProfile.findMany({
          where: {
            applications: {
              some: {
                job: {
                  org_id: orgId,
                },
              },
            },
          },
          include: {
            user: {
              select: { id: true, email: true, created_at: true },
            },
          },
          orderBy: { created_at: 'desc' },
          take: 50,
        });

        results = candidates.map((c) => {
          const skillsList = Array.isArray(c.skills) ? (c.skills as string[]) : [];
          const targetRolesList = Array.isArray(c.target_roles) ? (c.target_roles as string[]) : [];
          return serialize(c.id, c.user.id, c.user.email, skillsList, targetRolesList, c.resume_url, c.created_at, null);
        });
      }

      return res.json({
        success: true,
        data: {
          candidates: results,
          total: results.length,
          semanticMatch,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

talentPoolRouter.post(
  '/bookmarks',
  authenticate,
  requireRole('hr'),
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

talentPoolRouter.get(
  '/bookmarks',
  authenticate,
  requireRole('hr'),
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

talentPoolRouter.delete(
  '/bookmarks/:id',
  authenticate,
  requireRole('hr'),
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

talentPoolRouter.post(
  '/outreach',
  authenticate,
  requireRole('hr'),
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

talentPoolRouter.post(
  '/external-source',
  authenticate,
  requireRole('hr'),
  async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (err) {
      return next(err);
    }
  }
);

