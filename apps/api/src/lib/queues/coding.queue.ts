import { codingQueue, JOB_NAMES, DEFAULT_JOB_OPTIONS } from '../bullmq';

export interface CodingJobPayload {
  applicationId: string;
  problemId: string;
  code: string;
  language: string;
  submissionId: string;
  testCases?: any[];
  entryPoint?: string;
}

export async function enqueueCoding(
  applicationId: string,
  problemId: string,
  code: string,
  language: string,
  submissionId: string,
  testCases?: any[],
  entryPoint?: string
) {
  const payload: CodingJobPayload = {
    applicationId,
    problemId,
    code,
    language,
    submissionId,
    testCases,
    entryPoint,
  };

  const job = await codingQueue.add(JOB_NAMES.coding, payload, DEFAULT_JOB_OPTIONS);

  return job;
}
