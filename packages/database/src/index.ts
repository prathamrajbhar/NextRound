import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Construct the client lazily. The API loads its `.env` after this module is
 * imported (ESM/CJS import hoisting), so DATABASE_URL is not guaranteed to be
 * set at module-eval time. Deferring construction until first use keeps the
 * client robust to import order while preserving the single-instance pattern.
 */
function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Load dotenv before first Prisma use.');
  }
  const adapter = new PrismaPg({ connectionString });
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
