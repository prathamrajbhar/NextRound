import Redis from 'ioredis';
import { env } from './env';

const redisUrl = env('REDIS_URL');

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('[Redis Error]:', err);
});

export default redis;
