import { prisma } from '@nextround/database';

export interface ScoreContract {
  passRatePercent: number;
  passRateRatio: number;
  score: number;
}

/**
 * Updates application score in database without automatically assigning a hire/reject decision.
 * Evaluation recommendations are recorded separately for human recruiter review.
 */
export async function updateApplicationCodingScore(
  applicationId: string,
  passRatePercent: number
): Promise<ScoreContract> {
  const passRateRatio = Math.max(0, Math.min(1, passRatePercent / 100));

  await prisma.evaluation.upsert({
    where: { application_id: applicationId },
    update: {
      coding_score: passRatePercent,
      stage: 'assessment_completed',
      // Recruiter review recommendation flag (does NOT write hire/reject directly)
      reasoning: `Coding assessment evaluated: ${passRatePercent}% pass rate (${passRateRatio.toFixed(2)} ratio). Pending human review.`,
    },
    create: {
      application_id: applicationId,
      stage: 'assessment_completed',
      coding_score: passRatePercent,
      reasoning: `Coding assessment evaluated: ${passRatePercent}% pass rate (${passRateRatio.toFixed(2)} ratio). Pending human review.`,
    },
  });

  return {
    passRatePercent,
    passRateRatio,
    score: passRatePercent,
  };
}
