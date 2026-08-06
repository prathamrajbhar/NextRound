import { evaluatorQueue } from '../bullmq';

export interface EvaluationJobPayload {
  applicationId: string;
  stage: string;
  interviewId?: string;
  extraData?: Record<string, any>;
}

export async function enqueueEvaluation(
  applicationId: string,
  stage: string,
  extraData?: Record<string, any>
) {
  const payload: EvaluationJobPayload = {
    applicationId,
    stage,
    extraData,
  };

  const job = await evaluatorQueue.add('run_evaluation', payload, {
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
