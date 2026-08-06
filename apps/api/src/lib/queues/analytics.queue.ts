import { analyticsQueue } from '../bullmq';

export interface AnalyticsJobPayload {
  orgId?: string;
  type: 'weekly_report' | 'manual_export';
  format?: 'csv' | 'pdf';
  period?: string;
}

export async function enqueueAnalyticsReport(payload: AnalyticsJobPayload) {
  const job = await analyticsQueue.add('generate_analytics_report', payload, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: true,
  });

  return job;
}

// Register recurring weekly analytics cron job (Every Monday at 00:00 UTC)
export async function setupWeeklyAnalyticsCron() {
  try {
    await analyticsQueue.add(
      'weekly_analytics_cron',
      { type: 'weekly_report' },
      {
        repeat: {
          pattern: '0 0 * * 1', // Mondays 00:00 UTC
        },
        removeOnComplete: true,
      }
    );
  } catch (err) {
    console.error('Failed to setup weekly analytics cron job:', err);
  }
}
