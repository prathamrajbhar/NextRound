import { resumeBuilderQueue, JOB_NAMES, DEFAULT_JOB_OPTIONS } from '../bullmq';

export interface ResumeBuilderJobPayload {
  sessionId: string;
  candidateId: string;
  transcript?: any;
  targetRole?: string;
  targetCompany?: string;
  memory?: any;
}

export async function enqueueResumeBuilder(
  sessionId: string,
  candidateId: string,
  transcript?: any,
  targetRole?: string,
  targetCompany?: string,
  memory?: any
) {
  const payload: ResumeBuilderJobPayload = {
    sessionId,
    candidateId,
    transcript,
    targetRole,
    targetCompany,
    memory,
  };

  const job = await resumeBuilderQueue.add(JOB_NAMES.resumeBuilder, payload, DEFAULT_JOB_OPTIONS);

  return job;
}
