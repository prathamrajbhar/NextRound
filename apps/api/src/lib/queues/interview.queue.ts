import { interviewQueue } from '../bullmq';

export interface InterviewJobPayload {
  interviewId: string;
  applicationId: string;
  audioUrl?: string;
  transcript?: any;
  extraData?: Record<string, any>;
}

export async function enqueueInterview(
  interviewId: string,
  applicationId: string,
  extraData?: Record<string, any>
) {
  const payload: InterviewJobPayload = {
    interviewId,
    applicationId,
    extraData,
  };

  const job = await interviewQueue.add('interview_evaluate', payload, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  });

  return job;
}
