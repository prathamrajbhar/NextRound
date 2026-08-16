import { candidateEmbeddingQueue, DEFAULT_JOB_OPTIONS, JOB_NAMES } from '../bullmq';

export interface CandidateEmbedJobPayload {
  candidateId: string;
}

export async function enqueueCandidateEmbedding(candidateId: string) {
  const payload: CandidateEmbedJobPayload = { candidateId };
  const job = await candidateEmbeddingQueue.add(JOB_NAMES.candidateEmbed, payload, DEFAULT_JOB_OPTIONS);
  return job;
}