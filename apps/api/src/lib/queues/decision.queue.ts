import { decisionQueue, DEFAULT_JOB_OPTIONS } from '../bullmq';

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
    ...DEFAULT_JOB_OPTIONS,
    priority: 1, // Critical priority
  });

  return job;
}
