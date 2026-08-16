import path from 'path';
import { config } from 'dotenv';
// Load API .env first before dynamic imports are evaluated
config({ path: path.resolve(__dirname, '../../../.env') });

import { describe, expect, it } from 'vitest';

describe('Upstash Redis & BullMQ Integration Test', () => {
  it('should successfully write and read data using Upstash Redis REST client', async () => {
    const { redis } = await import('../src/lib/redis');
    const testKey = 'test:integration:key';
    const testValue = { timestamp: Date.now(), status: 'working' };

    // Set key
    await redis.set(testKey, JSON.stringify(testValue));

    // Get key
    const retrievedValue = await redis.get<{ timestamp: number; status: string } | string>(testKey);
    expect(retrievedValue).toBeDefined();

    const parsedValue = typeof retrievedValue === 'string'
      ? JSON.parse(retrievedValue)
      : retrievedValue;

    expect(parsedValue).toBeDefined();
    expect(parsedValue.status).toBe('working');

    // Clean up
    await redis.del(testKey);
  });

  it('should successfully add a job to BullMQ queue using TLS TCP connection', async () => {
    const { mockQueue } = await import('../src/lib/bullmq');
    const jobName = 'test-integration-job';
    const jobData = { test: true, timestamp: Date.now() };

    // Add job to mockQueue
    const job = await mockQueue.add(jobName, jobData, {
      removeOnComplete: true,
    });

    expect(job).toBeDefined();
    expect(job.id).toBeDefined();
    expect(job.name).toBe(jobName);

    // Clean up job
    await job.remove();
  });
});
