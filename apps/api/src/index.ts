import './env';
import { prisma } from '@nextround/database';
import { app } from './app';
import { ensureUploadDirsExist } from './lib/storage';
import { setupWeeklyAnalyticsCron } from './lib/queues/analytics.queue';
import { envNumber } from './lib/env';
import { logger } from './lib/logger';

const PORT = envNumber('PORT');

async function bootstrap() {
  try {
    ensureUploadDirsExist();
    setupWeeklyAnalyticsCron();

    logger.info('Connecting and pre-warming database connection pool...');
    const startTime = Date.now();
    await prisma.$connect();
    await prisma.user.findFirst({ select: { id: true } }).catch(() => {});
    logger.info(`Database connection pool and schema metadata warmed in ${Date.now() - startTime}ms`);

    const server = app.listen(PORT, () => {
      logger.info(`API server running on http://localhost:${PORT}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down API server gracefully...`);
      server.close(async () => {
        try {
          await prisma.$disconnect();
          logger.info('Database client disconnected cleanly.');
          process.exit(0);
        } catch (err) {
          logger.error('Error during database disconnection:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error('Fatal error during API bootstrap:', error);
    process.exit(1);
  }
}

bootstrap();
