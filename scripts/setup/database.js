const path = require('node:path');
const { printStep, printSection } = require('./ui');
const { runTaskWithSpinner } = require('./runner');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DB_PACKAGE_DIR = path.join(ROOT_DIR, 'packages', 'database');

async function setupDatabase() {
  printSection('Database Schema & Prisma Client', '🗄');

  const { result: genRes, spinner: genSpinner } = await runTaskWithSpinner(
    'Generating Prisma Client...',
    'npx',
    ['prisma', 'generate'],
    { cwd: DB_PACKAGE_DIR, env: { ...process.env } }
  );

  if (!genRes.ok) {
    genSpinner.fail(`Prisma client generation failed: ${genRes.stderr}`);
    return false;
  }
  genSpinner.succeed('Prisma client generated');

  const { result: pushRes, spinner: pushSpinner } = await runTaskWithSpinner(
    'Applying PostgreSQL database schema migrations safely...',
    'npx',
    ['prisma', 'db', 'push', '--skip-generate'],
    { cwd: DB_PACKAGE_DIR, env: { ...process.env } }
  );

  if (!pushRes.ok) {
    pushSpinner.fail(`Database schema push failed: ${pushRes.stderr}`);
    return false;
  }

  pushSpinner.succeed('PostgreSQL schema synchronized with pgvector');
  printStep('success', 'Database tables and vector models ready');
  return true;
}

module.exports = {
  setupDatabase,
};
