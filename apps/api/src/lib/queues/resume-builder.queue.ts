import { resumeBuilderQueue, JOB_NAMES, DEFAULT_JOB_OPTIONS } from '../bullmq';

export interface ResumeBuilderJobPayload {
  sessionId: string;
  candidateId: string;
  transcript?: any;
  targetRole?: string;
  targetCompany?: string;
}

export async function enqueueResumeBuilder(
  sessionId: string,
  candidateId: string,
  transcript?: any,
  targetRole?: string,
  targetCompany?: string
) {
  const payload: ResumeBuilderJobPayload = {
    sessionId,
    candidateId,
    transcript,
    targetRole,
    targetCompany,
  };

  const job = await resumeBuilderQueue.add(JOB_NAMES.resumeBuilder, payload, DEFAULT_JOB_OPTIONS);

  return job;
}
