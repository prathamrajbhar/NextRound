import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { emailService } from '../services/email.service';
import { EmailJobPayload } from '../lib/queues/email.queue';
import { logger } from '../lib/logger';
import { prisma } from '@nextround/database';

function parseRedisUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.startsWith('http://')) {
    url = url.replace(/^http:\/\//, 'redis://');
  } else if (url.startsWith('https://')) {
    url = url.replace(/^https:\/\//, 'rediss://');
  } else if (!url.startsWith('redis://') && !url.startsWith('rediss://')) {
    url = `redis://${url}`;
  }
  return url.replace(/\/+$/, '');
}

const rawRedisUrl = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://localhost:6379';
const redisConnection = new Redis(parseRedisUrl(rawRedisUrl), {
  maxRetriesPerRequest: null,
});

export class EmailWorker {
  private worker: Worker | null = null;

  public start(): void {
    if (this.worker) return;

    this.worker = new Worker<EmailJobPayload>(
      'email',
      async (job: Job<EmailJobPayload>) => {
        const { to, subject, html, text, userId } = job.data;
        logger.child('EmailWorker').info(`Processing email job #${job.id} to ${to} (attempt ${job.attemptsMade + 1})`);

        const sent = await emailService.sendImmediate({
          to,
          subject,
          html,
          text,
          userId,
        });

        if (!sent) {
          throw new Error(`SMTP delivery failed for ${to} (subject: ${subject})`);
        }

        if (userId) {
          try {
            await prisma.notification.create({
              data: {
                user_id: userId,
                title: subject,
                message: text || subject,
                type: 'email_dispatched',
              },
            });
          } catch (notifErr) {
            logger.child('EmailWorker').warn(`Could not record in-app notification for user ${userId}:`, notifErr);
          }
        }

        return { delivered: true, recipient: to, timestamp: new Date().toISOString() };
      },
      {
        connection: redisConnection,
        concurrency: 5,
        limiter: {
          max: 50,
          duration: 60000, // max 50 emails per minute to protect IP reputation
        },
      }
    );

    this.worker.on('completed', (job) => {
      logger.child('EmailWorker').info(`Email job #${job.id} successfully sent to ${job.data.to}`);
    });

    this.worker.on('failed', (job, err) => {
      logger.child('EmailWorker').error(`Email job #${job?.id} to ${job?.data.to} failed: ${err.message}`);
    });

    logger.child('EmailWorker').info('Email background worker started on queue email.');
  }

  public async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      logger.child('EmailWorker').info('Email background worker stopped gracefully.');
    }
  }
}

export const emailWorker = new EmailWorker();
