import { sourcingQueue } from '../bullmq';

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

  const job = await sourcingQueue.add(action, payload, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  });

  return job;
}
