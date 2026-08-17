import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from './generated/prisma/client';

declare global {
  var prismaGlobal: PrismaClient | undefined;
  var pgPoolGlobal: Pool | undefined;
}

function getOrCreatePool(): Pool {
  if (globalThis.pgPoolGlobal) {
    return globalThis.pgPoolGlobal;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Load dotenv before first Prisma use.');
  }

  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    keepAlive: true,
  });

  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL Pool Error:', err);
  });

  globalThis.pgPoolGlobal = pool;
  return pool;
}

function createClient(): PrismaClient {
  const pool = getOrCreatePool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const instance = globalThis.prismaGlobal ?? (globalThis.prismaGlobal = createClient());
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export * from './generated/prisma/client';
