import { env } from '../../lib/env';

export interface VectorMatchRow {
  candidateId: string;
  userId: string;
  email: string;
  createdAt: Date | string;
  resumeUrl: string | null;
  skills: unknown;
  targetRoles: unknown;
  cosineSimilarity: number | null;
}

export interface TalentPoolCandidateResult {
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

export function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function generateQueryEmbedding(queryText: string): Promise<number[] | null> {
  const aiServiceUrl = env('AI_BASE_URL');

  let response: Awaited<ReturnType<typeof fetch>>;
  try {
    response = await fetch(`${aiServiceUrl}/api/v1/embeddings/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: queryText }),
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  let body: { data?: { embedding?: unknown; model?: unknown } };
  try {
    body = (await response.json()) as { data?: { embedding?: unknown; model?: unknown } };
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
