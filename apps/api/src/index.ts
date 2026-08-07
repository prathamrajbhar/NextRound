import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { app } from './app';
import { ensureUploadDirsExist } from './lib/storage';

const PORT = parseInt(process.env.PORT || '4000', 10);

ensureUploadDirsExist();

app.listen(PORT, () => {
  console.log(`[NextRound API] Server running on http://localhost:${PORT}`);
});
