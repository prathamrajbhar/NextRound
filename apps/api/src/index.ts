import './env';
import { app } from './app';
import { ensureUploadDirsExist } from './lib/storage';
import { setupWeeklyAnalyticsCron } from './lib/queues/analytics.queue';
import { envNumber } from './lib/env';

const PORT = envNumber('PORT');

ensureUploadDirsExist();
setupWeeklyAnalyticsCron();

app.listen(PORT, () => {
  console.log(`[NextRound API] Server running on http://localhost:${PORT}`);
});