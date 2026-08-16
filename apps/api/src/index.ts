import './env';
import { app } from './app';
import { ensureUploadDirsExist } from './lib/storage';
import { setupWeeklyAnalyticsCron } from './lib/queues/analytics.queue';
import { envNumber } from './lib/env';
import { logger } from './lib/logger';

const PORT = envNumber('PORT');

ensureUploadDirsExist();
setupWeeklyAnalyticsCron();

app.listen(PORT, () => {
  logger.info(`API server running on http://localhost:${PORT}`);
});