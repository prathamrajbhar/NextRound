const path = require('node:path');
const { printStep, printSection, printBox, c } = require('./ui');
const { runTaskWithSpinner } = require('./runner');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

async function buildSharedPackages() {
  printSection('Monorepo Package Compilation', '⚡');

  const { result: buildRes, spinner } = await runTaskWithSpinner(
    'Building shared packages (@nextround/shared, @nextround/database)...',
    'npx',
    ['turbo', 'build', '--filter=@nextround/shared', '--filter=@nextround/database'],
    { cwd: ROOT_DIR, env: { ...process.env } }
  );

  if (!buildRes.ok) {
    spinner.fail(`Workspace build failed: ${buildRes.stderr}`);
    return false;
  }

  spinner.succeed('Shared workspace packages compiled successfully');
  printStep('success', '@nextround/shared');
  printStep('success', '@nextround/database');
  return true;
}

function printSummaryCard(results) {
  const allGood = Object.values(results).every(Boolean);

  const statusLine = allGood
    ? `${c.green('✔')} ${c.bold('Workspace Setup Complete & Ready!')}`
    : `${c.yellow('▲')} ${c.bold('Workspace Setup completed with some warnings.')}`;

  const summary = `
  ${statusLine}

  ${c.cyan('Application Endpoints:')}
  ${c.bold('Frontend Web (Next.js 16)')} : ${c.white('http://localhost:3000')}
  ${c.bold('Backend API (Express 5)')}   : ${c.white('http://localhost:4000')}
  ${c.bold('AI Service (FastAPI)')}      : ${c.white('http://localhost:8000')}

  ${c.cyan('Infrastructure Services:')}
  ${c.bold('PostgreSQL + pgvector')}     : ${c.white('localhost:5432')}
  ${c.bold('Redis In-Memory Queue')}     : ${c.white('localhost:6379')}
  ${c.bold('LocalStack S3 Bucket')}      : ${c.white('http://localhost:4566')}

  ${c.cyan('Quick Commands:')}
  ${c.magenta('npm run dev')}              ${c.gray('— Start Web, API & AI Services in watch mode')}
  ${c.magenta('npm run build')}            ${c.gray('— Build all workspace apps and packages')}
  ${c.magenta('npm run lint')}             ${c.gray('— Run linters & typecheck across monorepo')}
  ${c.magenta('npm run db:studio')}        ${c.gray('— Launch Prisma Studio for database GUI')}
  `;

  printBox(summary.trim(), allGood ? 'green' : 'yellow');
}

module.exports = {
  buildSharedPackages,
  printSummaryCard,
};
