import { interviewQueue, JOB_NAMES, DEFAULT_JOB_OPTIONS } from '../bullmq';

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
    transcript: extraData?.transcript,
    audioUrl: extraData?.audioUrl,
    extraData,
  };

  const job = await interviewQueue.add(JOB_NAMES.interview, payload, DEFAULT_JOB_OPTIONS);

  return job;
}
