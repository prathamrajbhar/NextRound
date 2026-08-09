import { resumeBuilderQueue, DEFAULT_JOB_OPTIONS } from '../bullmq';

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

  const job = await resumeBuilderQueue.add('resume_builder_generate', payload, DEFAULT_JOB_OPTIONS);

  return job;
}
