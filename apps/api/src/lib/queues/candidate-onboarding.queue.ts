import { candidateEmbeddingQueue, DEFAULT_JOB_OPTIONS, JOB_NAMES } from '../bullmq';
import { logger } from '../../lib/logger';

export interface CandidateEmbedJobPayload {
  candidateId: string;
}

export async function enqueueCandidateEmbedding(candidateId: string) {
  const payload: CandidateEmbedJobPayload = { candidateId };
  const job = await candidateEmbeddingQueue.add(JOB_NAMES.candidateEmbed, payload, DEFAULT_JOB_OPTIONS);
  logger.child('Embedding').info(`Enqueued embedding build job ${job.id || ''} for candidate ${candidateId}`);
  return job;
}