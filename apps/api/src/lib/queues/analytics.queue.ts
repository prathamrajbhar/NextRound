import { analyticsQueue, JOB_NAMES, DEFAULT_JOB_OPTIONS } from '../bullmq';
import { logger } from '../../lib/logger';

export interface AnalyticsJobPayload {
  orgId?: string;
  type: 'weekly_report' | 'manual_export';
  format?: 'csv' | 'pdf';
  period?: string;
}

export async function enqueueAnalyticsReport(payload: AnalyticsJobPayload) {
  const job = await analyticsQueue.add(JOB_NAMES.analytics, payload, {
    ...DEFAULT_JOB_OPTIONS,
    backoff: { type: 'exponential', delay: 3000 },
  });

  return job;
}

export async function setupWeeklyAnalyticsCron() {
  try {
    await analyticsQueue.upsertJobScheduler(
      'weekly_analytics_cron',
      { pattern: '0 0 * * 1' },
      {
        name: 'weekly_analytics_cron',
        data: { type: 'weekly_report' },
        opts: { removeOnComplete: true },
      }
    );
  } catch (err) {
    logger.child('AnalyticsCron').error('Failed to setup weekly analytics cron job:', err);
  }
}
