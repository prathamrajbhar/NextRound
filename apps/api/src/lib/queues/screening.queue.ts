import { screeningQueue, DEFAULT_JOB_OPTIONS } from '../bullmq';

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

  const job = await screeningQueue.add('screening_evaluate', payload, DEFAULT_JOB_OPTIONS);

  return job;
}
