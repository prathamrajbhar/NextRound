import { interviewQueue, JOB_NAMES, DEFAULT_JOB_OPTIONS } from '../bullmq';

export interface InterviewJobPayload {
  interviewId: string;
  applicationId: string;
  audioUrl?: string;
  transcript?: unknown;
  extraData?: Record<string, unknown>;
}

export async function enqueueInterview(
  interviewId: string,
  applicationId: string,
  extraData?: Record<string, unknown>
) {
  const payload: InterviewJobPayload = {
    interviewId,
    applicationId,
    transcript: extraData?.transcript,
    audioUrl: typeof extraData?.audioUrl === 'string' ? extraData.audioUrl : undefined,
    extraData,
  };

  const job = await interviewQueue.add(JOB_NAMES.interview, payload, DEFAULT_JOB_OPTIONS);

  return job;
}
