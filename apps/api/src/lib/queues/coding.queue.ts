import { codingQueue, DEFAULT_JOB_OPTIONS } from '../bullmq';

export interface CodingJobPayload {
  applicationId: string;
  problemId: string;
  code: string;
  language: string;
  submissionId: string;
}

export async function enqueueCoding(
  applicationId: string,
  problemId: string,
  code: string,
  language: string,
  submissionId: string
) {
  const payload: CodingJobPayload = {
    applicationId,
    problemId,
    code,
    language,
    submissionId,
  };

  const job = await codingQueue.add('evaluate_coding', payload, DEFAULT_JOB_OPTIONS);

  return job;
}
