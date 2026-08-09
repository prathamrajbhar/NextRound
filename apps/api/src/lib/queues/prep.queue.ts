import { prepQueue, DEFAULT_JOB_OPTIONS } from '../bullmq';

export interface PrepJobPayload {
  companyName: string;
  roleArchetype: string;
  jobId?: string;
  orgId?: string;
  rubricDimensions?: string[];
}

export async function enqueuePrepGeneration(
  companyName: string,
  roleArchetype: string,
  jobId?: string,
  orgId?: string,
  rubricDimensions?: string[]
) {
  const payload: PrepJobPayload = {
    companyName,
    roleArchetype,
    jobId,
    orgId,
    rubricDimensions,
  };

  const job = await prepQueue.add('prep_generate', payload, DEFAULT_JOB_OPTIONS);

  return job;
}
