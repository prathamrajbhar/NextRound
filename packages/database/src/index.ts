import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from './generated/prisma/client';

declare global {
  var prismaGlobal: PrismaClient | undefined;
  var pgPoolGlobal: Pool | undefined;
}

const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) {
  throw new Error('DATABASE_URL environment variable is required.');
}

function getPoolConfig(connectionStr: string) {
  const isCloudOrSsl = connectionStr.includes('rds.amazonaws.com') ||
    connectionStr.includes('sslmode=require') ||
    connectionStr.includes('sslmode=no-verify') ||
    connectionStr.includes('sslmode=prefer');

  if (isCloudOrSsl) {
    try {
      const url = new URL(connectionStr);
      url.searchParams.delete('sslmode');
      url.searchParams.delete('ssl');
      return {
        connectionString: url.toString(),
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 60000,
        connectionTimeoutMillis: 30000,
        keepAlive: true,
      };
    } catch {
      // fallback to raw connection string
    }
  }

  return {
    connectionString: connectionStr,
    max: 20,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 30000,
    keepAlive: true,
  };
}

const pool = globalThis.pgPoolGlobal ?? (globalThis.pgPoolGlobal = new Pool(getPoolConfig(rawConnectionString)));

export const prisma = globalThis.prismaGlobal ?? (globalThis.prismaGlobal = new PrismaClient({
  adapter: new PrismaPg(pool)
}));

export * from './generated/prisma/client';
