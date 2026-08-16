import { Redis } from '@upstash/redis';
import { env } from './env';

const upstashRestUrl = env('UPSTASH_REDIS_REST_URL');
const upstashRestToken = env('UPSTASH_REDIS_REST_TOKEN');

export const redis = new Redis({
  url: upstashRestUrl,
  token: upstashRestToken,
});

export default redis;
