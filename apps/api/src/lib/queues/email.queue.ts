import { emailQueue, JOB_NAMES, DEFAULT_JOB_OPTIONS } from '../bullmq';
import { logger } from '../logger';

export interface EmailJobPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export async function enqueueEmail(payload: EmailJobPayload) {
  try {
    const job = await emailQueue.add(JOB_NAMES.email, payload, {
      ...DEFAULT_JOB_OPTIONS,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
    });
    logger.child('EmailQueue').info(`Enqueued email job #${job.id} to ${payload.to}: ${payload.subject}`);
    return job;
  } catch (err) {
    logger.child('EmailQueue').error(`Failed to enqueue email job for ${payload.to}:`, err);
    throw err;
  }
}
