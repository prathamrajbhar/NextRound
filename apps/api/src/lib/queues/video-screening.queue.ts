import { videoScreeningQueue, JOB_NAMES, DEFAULT_JOB_OPTIONS } from '../bullmq';

export interface VideoScreeningResponse {
  questionId: string;
  questionText?: string;
  answer?: string;
  durationSeconds?: number;
}

export interface VideoScreeningJobPayload {
  applicationId: string;
  responses?: VideoScreeningResponse[];
}

export async function enqueueVideoScreening(
  applicationId: string,
  responses?: VideoScreeningResponse[]
) {
  const payload: VideoScreeningJobPayload = {
    applicationId,
    responses,
  };

  const job = await videoScreeningQueue.add(JOB_NAMES.videoScreening, payload, DEFAULT_JOB_OPTIONS);

  return job;
}
