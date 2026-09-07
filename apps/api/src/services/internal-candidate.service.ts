import { prisma } from '@nextround/database';
import { notFound, badRequest } from '../lib/http-errors';
import { buildContextSections, hashContent } from './candidate-embedding.service';
import { getCandidateInterviewContext } from './candidate-context.service';
import { deleteCandidateSocialSource as removeCandidateSocialSource } from './social-sync.service';

async function fetchProfileEmbedding(text: string): Promise<number[] | null> {
  const aiServiceUrl = process.env.AI_BASE_URL || 'http://localhost:8000';
  try {
    const response = await fetch(`${aiServiceUrl}/api/v1/embeddings/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: { embedding?: unknown } };
    const embedding = body.data?.embedding;
    if (!Array.isArray(embedding) || embedding.length !== 768) return null;
    return embedding as number[];
  } catch {
    return null;
  }
}

export async function updateCandidateEmbedding(candidateId: string, body: Record<string, unknown>) {
  const id = candidateId;
  const { embedding } = body;

  if (!Array.isArray(embedding) || embedding.length !== 768) {
    throw badRequest('Embedding must be a 768-dimensional float array');
  }

  const vectorString = `[${embedding.join(',')}]`;
  await prisma.$executeRaw`UPDATE "CandidateProfile" SET resume_embedding = ${vectorString}::vector WHERE id = ${id}`;

  return { message: 'Candidate embedding updated successfully' };
}

export async function getCandidateSections(candidateId: string) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { id: candidateId },
    include: { social_syncs: true },
  });
  if (!profile) throw notFound('Candidate profile not found');

  const syncs = profile.social_syncs.map((sync) => ({ source: sync.source, normalized_data: sync.normalized_data }));
  const sections = buildContextSections(profile, syncs);

  const existing = await prisma.candidateEmbedding.findMany({
    where: { candidate_id: candidateId },
    select: { source_type: true, section: true, content_hash: true },
  });
  const existingHashes = new Map(existing.map((item) => [`${item.source_type}:${item.section}`, item.content_hash]));

  return {
    candidateId,
    sections: sections.map((sectionItem) => ({
      sourceType: sectionItem.sourceType,
      section: sectionItem.section,
      content: sectionItem.content,
      contentHash: hashContent(sectionItem.content),
    })),
    existing: Array.from(existingHashes.entries()).map(([key, hash]) => {
      const [sourceType, ...rest] = key.split(':');
      return { sourceType, section: rest.join(':'), contentHash: hash };
    }),
  };
}

export async function saveCandidateEmbeddings(candidateId: string, body: Record<string, unknown>) {
  const sections = Array.isArray(body.sections) ? body.sections : [];

  let upserted = 0;
  let skipped = 0;
  const profileSections: string[] = [];

  for (const item of sections) {
    const rawItem = item as Record<string, unknown>;
    const sourceType = typeof rawItem.sourceType === 'string' ? rawItem.sourceType : (rawItem.source_type as string | undefined);
    const section = typeof rawItem.section === 'string' ? rawItem.section : '';
    const content = typeof rawItem.content === 'string' ? rawItem.content : '';
    const contentHash = typeof rawItem.contentHash === 'string' ? rawItem.contentHash : (rawItem.content_hash as string | undefined);
    const embedding = Array.isArray(rawItem.embedding) ? rawItem.embedding : [];

    if (!sourceType || !section || !content || !contentHash || embedding.length !== 768) {
      continue;
    }

    const existing = await prisma.candidateEmbedding.findUnique({
      where: {
        candidate_id_source_type_section: { candidate_id: candidateId, source_type: sourceType, section },
      },
      select: { content_hash: true },
    });

    if (existing && existing.content_hash === contentHash) {
      skipped += 1;
      continue;
    }

    const vectorString = `[${embedding.join(',')}]`;
    await prisma.$executeRaw`
      INSERT INTO "CandidateEmbedding" (id, candidate_id, source_type, section, content, embedding, content_hash, created_at, updated_at)
      VALUES (gen_random_uuid(), ${candidateId}, ${sourceType}, ${section}, ${content}, ${vectorString}::vector, ${contentHash}, now(), now())
      ON CONFLICT ("candidate_id", "source_type", "section")
      DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding,
        content_hash = EXCLUDED.content_hash, updated_at = now()
    `;
    upserted += 1;
    if (sourceType === 'profile') profileSections.push(content);
  }

  if (profileSections.length > 0) {
    const profileEmbedding = await fetchProfileEmbedding(profileSections.join('\n\n'));
    if (profileEmbedding) {
      const vectorString = `[${profileEmbedding.join(',')}]`;
      await prisma.$executeRaw`UPDATE "CandidateProfile" SET resume_embedding = ${vectorString}::vector WHERE id = ${candidateId}`;
    }
  }

  return { message: 'Candidate embeddings updated', upserted, skipped };
}

export async function deleteCandidateSocialSource(candidateId: string, source: string) {
  if (source !== 'github' && source !== 'linkedin') {
    throw badRequest('source must be "github" or "linkedin"');
  }
  await removeCandidateSocialSource(candidateId, source);
  return { message: `Removed ${source} social data` };
}

export async function getCandidateInterviewContextInternal(candidateId: string, jobId: string) {
  return getCandidateInterviewContext(candidateId, jobId);
}
