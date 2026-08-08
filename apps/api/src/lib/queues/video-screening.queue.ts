import { videoScreeningQueue } from '../bullmq';

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

  const job = await videoScreeningQueue.add('score_video_screening', payload, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  });

  return job;
}
