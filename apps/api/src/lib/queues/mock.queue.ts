import { mockQueue } from '../bullmq';

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

  const job = await mockQueue.add('mock_evaluate', payload, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  });

  return job;
}
