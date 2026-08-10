import { sourcingQueue, JOB_NAMES, DEFAULT_JOB_OPTIONS } from '../bullmq';

export type SourcingAction = (typeof JOB_NAMES.sourcing)[keyof typeof JOB_NAMES.sourcing];

export interface SourcingJobPayload {
  jobId: string;
  action: SourcingAction;
  extraData?: Record<string, any>;
}

export async function enqueueSourcing(
  jobId: string,
  action: SourcingAction = JOB_NAMES.sourcing.sourcingIndex,
  extraData?: Record<string, any>
) {
  const payload: SourcingJobPayload = {
    jobId,
    action,
    extraData,
  };

  const job = await sourcingQueue.add(action, payload, DEFAULT_JOB_OPTIONS);

  return job;
}
