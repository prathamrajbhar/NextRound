import { decisionQueue } from '../bullmq';

export interface DecisionJobPayload {
  applicationId: string;
  evaluationId?: string;
  compositeScore?: number;
  confidence?: number;
  extraData?: Record<string, any>;
}

export async function enqueueDecision(
  applicationId: string,
  evaluationId?: string,
  compositeScore?: number,
  confidence?: number,
  extraData?: Record<string, any>
) {
  const payload: DecisionJobPayload = {
    applicationId,
    evaluationId,
    compositeScore,
    confidence,
    extraData,
  };

  const job = await decisionQueue.add('run_decision', payload, {
    priority: 1, // Critical priority
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  });

  return job;
}
