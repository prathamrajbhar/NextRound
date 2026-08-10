import { screeningQueue, JOB_NAMES, DEFAULT_JOB_OPTIONS } from '../bullmq';

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

  const job = await screeningQueue.add(JOB_NAMES.screening, payload, DEFAULT_JOB_OPTIONS);

  return job;
}
