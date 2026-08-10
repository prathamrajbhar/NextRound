import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { app } from './app';
import { ensureUploadDirsExist } from './lib/storage';
import { setupWeeklyAnalyticsCron } from './lib/queues/analytics.queue';

const PORT = parseInt(process.env.PORT || '4000', 10);

ensureUploadDirsExist();
// Register recurring weekly analytics report scheduler (Mondays 00:00 UTC).
// Runs inside a try/catch in the helper so a Redis outage at boot never
// prevents the API from starting.
setupWeeklyAnalyticsCron();

app.listen(PORT, () => {
  console.log(`[NextRound API] Server running on http://localhost:${PORT}`);
});
