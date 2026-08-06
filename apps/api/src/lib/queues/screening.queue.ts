import { screeningQueue } from '../bullmq';

export interface ScreeningJobPayload {
  applicationId: string;
  extraData?: Record<string, any>;
}

export async function enqueueScreening(
  applicationId: string,
  extraData?: Record<string, any>
) {
  const payload: ScreeningJobPayload = {
    applicationId,
    extraData,
  };

  const job = await screeningQueue.add('screening_evaluate', payload, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  });

  return job;
}
