import { mockQueue, DEFAULT_JOB_OPTIONS } from '../bullmq';

export interface MockJobPayload {
  sessionId: string;
  candidateId: string;
  topic?: string;
  difficulty?: string;
  transcript?: any;
}

export async function enqueueMockEvaluation(
  sessionId: string,
  candidateId: string,
  transcript?: any,
  topic?: string,
  difficulty?: string
) {
  const payload: MockJobPayload = {
    sessionId,
    candidateId,
    topic,
    difficulty,
    transcript,
  };

  const job = await mockQueue.add('mock_evaluate', payload, DEFAULT_JOB_OPTIONS);

  return job;
}
