import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { TalentPoolSearchSchema } from '@nextround/shared';
import {
  VectorMatchRow,
  TalentPoolCandidateResult,
  toStringList,
  generateQueryEmbedding,
} from './talent-pool.helpers';

export async function searchTalentPool(req: Request, res: Response, next: NextFunction) {
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
  } catch (error) {
    return next(error);
  }
}
