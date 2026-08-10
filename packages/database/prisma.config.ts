import 'dotenv/config';

import { defineConfig } from '@prisma/config';

/**
 * Prisma 7 CLI configuration.
 *
 * The datasource `url` moved out of schema.prisma into this file. The CLI
 * (migrate / db push / db seed) connects via `datasource.url`; at runtime the
 * generated client connects through the PrismaPg driver adapter, so the two
 * connection strings must stay in sync.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
});
