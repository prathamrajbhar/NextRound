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

// Row shape returned by the pgvector ranking query. `cosineSimilarity` is the
// real cosine similarity (0.0-1.0) between the candidate's resume_embedding and
// the query embedding; `skills`/`targetRoles` come back as parsed JSON arrays.
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

/**
 * Ask the AI service for a real 768-dim semantic embedding of the search query.
 * Returns null (instead of throwing) when the service is unreachable, the HTTP
 * call fails, the response is malformed, or the embedding came from the hash
 * fallback (model label contains "Fallback") — a fallback vector is not a
 * semantic signal and must never drive matching.
 */
async function generateQueryEmbedding(queryText: string): Promise<number[] | null> {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

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

      // Map each candidate to their most recent application so the UI can
      // link to the candidate dossier (which is keyed by application id).
      const applications = await prisma.application.findMany({
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

      // semanticMatch is true only when a REAL semantic embedding was produced
      // and the pgvector ranking actually ran. Otherwise similarityScore is
      // honestly null and candidates fall back to recency order.
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
        // No honest semantic ranking available (no query, ai-service down, or
        // hash-fallback embedding). Return recent candidates, score null.
        const candidates = await prisma.candidateProfile.findMany({
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

// POST /api/v1/hr/talent-pool/external-source - External Talent Sourcing via GitHub & LinkedIn scraper APIs
talentPoolRouter.post(
  '/external-source',
  authenticate,
  requireRole('hr'),
  rejectExplicitOrgId,
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

      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
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

