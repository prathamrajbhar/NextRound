import { sourcingQueue, DEFAULT_JOB_OPTIONS } from '../bullmq';

export interface SourcingJobPayload {
  jobId: string;
  action: 'ai-jd-assist' | 'sourcing_index' | 'prep-generate';
  extraData?: Record<string, any>;
}

export async function enqueueSourcing(
  jobId: string,
  action: 'ai-jd-assist' | 'sourcing_index' | 'prep-generate' = 'sourcing_index',
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
