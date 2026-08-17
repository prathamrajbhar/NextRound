import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from './generated/prisma/client';

declare global {
  var prismaGlobal: PrismaClient | undefined;
  var pgPoolGlobal: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required.');
}

const pool = globalThis.pgPoolGlobal ?? (globalThis.pgPoolGlobal = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
}));

export const prisma = globalThis.prismaGlobal ?? (globalThis.prismaGlobal = new PrismaClient({
  adapter: new PrismaPg(pool)
}));

export * from './generated/prisma/client';
