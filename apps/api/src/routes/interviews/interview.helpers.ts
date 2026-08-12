import { Prisma } from '@nextround/database';
import { prisma } from '@nextround/database';

// ---------------------------------------------------------------------------
// ICE server config
// ---------------------------------------------------------------------------

export interface IceServer {
  urls: string;
  username?: string;
  credential?: string;
}

/**
 * Loads ICE server config from the `ICE_SERVERS` env var (JSON array).
 * Falls back to two public Google STUN servers when the env var is absent or
 * malformed. TURN credentials are never fabricated.
 */
export function loadIceServers(): IceServer[] {
  const raw = process.env.ICE_SERVERS;
  if (raw?.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(
          (s): s is IceServer =>
            typeof s === 'object' &&
            s !== null &&
            typeof (s as { urls?: unknown }).urls === 'string',
        );
        if (valid.length > 0) return valid;
      }
    } catch {
      console.error('[ICE] Failed to parse ICE_SERVERS env var; falling back to STUN defaults');
    }
  }
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];
}

// ---------------------------------------------------------------------------
// Shared interview DB lookup
// ---------------------------------------------------------------------------

type FindInterviewArgs<T extends Prisma.InterviewInclude> = {
  idOrApplicationId: string;
  include?: T;
};

/**
 * Resolves an Interview by either its own primary key (`id`) OR by its linked
 * `application_id`. This allows the frontend to pass either identifier without
 * the caller needing to know which type it is.
 */
export async function findInterviewByRef<T extends Prisma.InterviewInclude>(
  args: FindInterviewArgs<T>,
) {
  const { idOrApplicationId: id, include } = args;
  return prisma.interview.findFirst({
    where: { OR: [{ id }, { application_id: id }] },
    // TypeScript requires the cast here because Prisma's conditional include
    // generic cannot be narrowed through a conditional parameter.
    ...(include ? { include } : {}),
  }) as Promise<Prisma.InterviewGetPayload<{ include: T }> | null>;
}

// ---------------------------------------------------------------------------
// Decision score computation
// ---------------------------------------------------------------------------

type EvaluationRow = {
  composite_score: number | null | undefined;
  confidence: number | null | undefined;
  resume_score: number | null | undefined;
  interview_score: number | null | undefined;
  aptitude_score: number | null | undefined;
  coding_score: number | null | undefined;
};

const STAGE_WEIGHTS = [
  ['resume_score', 0.2],
  ['aptitude_score', 0.2],
  ['coding_score', 0.3],
  ['interview_score', 0.3],
] as const satisfies ReadonlyArray<[keyof EvaluationRow, number]>;

/**
 * Returns the best available composite score for the Decision Agent:
 * 1. Uses the pre-computed `composite_score` from the evaluator if present.
 * 2. Falls back to a weighted average of per-stage scores.
 */
export function computeCompositeScore(evaluation: EvaluationRow): number | null {
  if (typeof evaluation.composite_score === 'number') {
    return evaluation.composite_score;
  }

  const weightedSum = STAGE_WEIGHTS.reduce((sum, [key, weight]) => {
    const score = evaluation[key];
    return typeof score === 'number' ? sum + score * weight : sum;
  }, 0);

  const totalWeight = STAGE_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
  return totalWeight > 0 ? weightedSum / totalWeight : null;
}
