import { Queue, type JobsOptions } from 'bullmq';
import { redis } from './redis';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

/**
 * Retry policy shared by every worker queue in this app. BullMQ replays a
 * failed job with exponential backoff starting at `delay`, and discards the
 * job record once it completes. Override per-enqueue by spreading this object
 * (e.g. `{ ...DEFAULT_JOB_OPTIONS, priority: 1 }`).
 */
export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: true,
};

/**
 * Canonical BullMQ job names, keyed by queue. Every enqueue in the app must
 * use a name from here (via the per-queue wrappers in `lib/queues/`) so two
 * producers can never enqueue the same queue under different names again.
 * The sourcing queue multiplexes job types via its `action` field, so its
 * names are nested.
 */
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
  videoScreening: 'score_video_screening',
  mock: 'mock_evaluate',
  prep: 'prep_generate',
  resumeBuilder: 'resume_builder_generate',
  analytics: 'generate_analytics_report',
} as const;

export const QUEUE_NAMES = [
  'sourcing',
  'screening',
  'interview',
  'evaluator',
  'bias-audit',
  'decision',
  'offer',
  'mock',
  'prep',
  'resume-builder',
  'scheduling',
  'assessment',
  'coding',
  'video-screening',
  'analytics',
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
export const codingQueue = getQueue('coding');
export const videoScreeningQueue = getQueue('video-screening');
export const analyticsQueue = getQueue('analytics');
