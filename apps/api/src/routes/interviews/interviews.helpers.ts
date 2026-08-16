import { Prisma } from '@nextround/database';
import { prisma } from '@nextround/database';
import { logger } from '../../lib/logger';





export interface IceServer {
  urls: string;
  username?: string;
  credential?: string;
}






export function loadIceServers(): IceServer[] {
  const raw = process.env.WEBRTC_ICE_SERVERS;
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
      logger.child('ICE').warn('Failed to parse WEBRTC_ICE_SERVERS env var; falling back to STUN defaults');
    }
  }
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];
}





type FindInterviewArgs<T extends Prisma.InterviewInclude> = {
  idOrApplicationId: string;
  include?: T;
};






export async function findInterviewByRef<T extends Prisma.InterviewInclude>(
  args: FindInterviewArgs<T>,
) {
  const { idOrApplicationId: id, include } = args;
  return prisma.interview.findFirst({
    where: { OR: [{ id }, { application_id: id }] },
    
    
    ...(include ? { include } : {}),
  }) as Promise<Prisma.InterviewGetPayload<{ include: T }> | null>;
}





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
