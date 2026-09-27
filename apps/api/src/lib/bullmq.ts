import { Queue, type JobsOptions } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 500, 5000),
  reconnectOnError: () => true,
  enableOfflineQueue: true,
  lazyConnect: false,
});

connection.on('error', (err: NodeJS.ErrnoException) => {
  // Suppress noisy ECONNRESET/ECONNREFUSED logs — ioredis retries automatically
  if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') return;
  console.error('[Redis] Unexpected connection error:', err.message);
});


export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: true,
};

export const JOB_NAMES = {
  sourcing: {
    jdAssist: 'ai-jd-assist',
    sourcingIndex: 'sourcing_index',
    prepGenerate: 'prep-generate',
  },
  screening: 'screening_evaluate',
  interview: 'interview_evaluate',
  evaluator: 'run_evaluation',
  decision: 'run_decision',
  scheduling: 'schedule_negotiation',
  assessment: 'score_aptitude',
  coding: 'evaluate_coding',
  mock: 'mock_evaluate',
  prep: 'prep_generate',
  resumeBuilder: 'resume_builder_generate',
  analytics: 'generate_analytics_report',
  candidateEmbed: 'candidate_embed',
  email: 'send_email',
} as const;

export const QUEUE_NAMES = [
  'sourcing',
  'screening',
  'interview',
  'evaluator',
  'decision',
  'offer',
  'mock',
  'prep',
  'resume-builder',
  'scheduling',
  'assessment',
  'coding',
  'analytics',
  'candidate',
  'email',
] as const;

export type QueueName = typeof QUEUE_NAMES[number];

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, { connection });
    queues.set(name, queue);
  }
  return queues.get(name)!;
}

export const sourcingQueue = getQueue('sourcing');
export const screeningQueue = getQueue('screening');
export const interviewQueue = getQueue('interview');
export const evaluatorQueue = getQueue('evaluator');
export const decisionQueue = getQueue('decision');
export const mockQueue = getQueue('mock');
export const resumeBuilderQueue = getQueue('resume-builder');
export const schedulingQueue = getQueue('scheduling');
export const assessmentQueue = getQueue('assessment');
export const analyticsQueue = getQueue('analytics');
export const candidateEmbeddingQueue = getQueue('candidate');
export const emailQueue = getQueue('email');
