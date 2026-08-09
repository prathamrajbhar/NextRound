import { evaluatorQueue, DEFAULT_JOB_OPTIONS } from '../bullmq';

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
    ...DEFAULT_JOB_OPTIONS,
    priority: 1, // Critical priority
  });

  return job;
}
