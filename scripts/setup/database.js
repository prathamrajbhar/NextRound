const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { printStep, printSection, createSpinner } = require('./ui');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DB_PACKAGE_DIR = path.join(ROOT_DIR, 'packages', 'database');

async function setupDatabase() {
  printSection('Database Schema & Prisma Client', '🗄');

  const spinner = createSpinner('Generating Prisma Client...');
  spinner.start();

  try {
    const genRes = spawnSync('npx', ['prisma', 'generate'], {
      cwd: DB_PACKAGE_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    if (genRes.status !== 0) {
      spinner.fail(`Prisma client generation failed: ${genRes.stderr}`);
      return false;
    }

    spinner.update('Applying PostgreSQL database schema migrations safely...');

    const pushRes = spawnSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
      cwd: DB_PACKAGE_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    if (pushRes.status !== 0) {
      spinner.fail(`Database schema push failed: ${pushRes.stderr}`);
      return false;
    }

    spinner.succeed('Prisma client generated and PostgreSQL schema synchronized');
    printStep('success', 'Tables & pgvector extensions ready');
    return true;
  } catch (err) {
    spinner.fail(`Database initialization error: ${err.message}`);
    return false;
  }
}

module.exports = {
  setupDatabase,
};
