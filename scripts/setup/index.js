#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { printBanner, printSection, printStep, promptSelect, createSpinner, c } = require('./ui');
const { checkAllPrereqs } = require('./prereqs');
const { setupEnvFile } = require('./env');
const { startDockerInfrastructure } = require('./docker');
const { setupPythonEnvironment } = require('./python');
const { setupDatabase } = require('./database');
const { setupLocalStorage } = require('./storage');
const { buildSharedPackages, printSummaryCard } = require('./verify');

const { installNodeDeps } = require('./deps');

async function runFullSetup(interactive = false) {
  const results = {};

  const prereqCheck = checkAllPrereqs();
  results.prereqs = prereqCheck.ok;
  if (!prereqCheck.ok) {
    printStep('warning', 'Some system prerequisites need attention before services can run.');
  }

  results.env = await setupEnvFile(interactive);
  results.nodeDeps = await installNodeDeps();
  results.docker = await startDockerInfrastructure();
  results.python = await setupPythonEnvironment();

  if (results.docker) {
    results.database = await setupDatabase();
    results.storage = await setupLocalStorage();
  }

  results.build = await buildSharedPackages();
  printSummaryCard(results);
}

async function main() {
  const args = process.argv.slice(2);
  const isAuto = args.includes('--yes') || args.includes('-y');
  const isDoctor = args.includes('--doctor');
  const isDockerOnly = args.includes('--docker-only');
  const isPythonOnly = args.includes('--python-only');
  const isDbOnly = args.includes('--db-only');

  printBanner();

  if (isDoctor) {
    checkAllPrereqs();
    process.exit(0);
  }

  if (isDockerOnly) {
    await startDockerInfrastructure();
    process.exit(0);
  }

  if (isPythonOnly) {
    await setupPythonEnvironment();
    process.exit(0);
  }

  if (isDbOnly) {
    await setupDatabase();
    process.exit(0);
  }

  if (isAuto) {
    await runFullSetup(false);
    process.exit(0);
  }

  const action = await promptSelect('Choose a setup action:', [
    { value: 'full', label: 'Full Automated Workspace Setup', hint: 'All dependencies, Docker, Python venv, DB, S3' },
    { value: 'doctor', label: 'Run Health & Prerequisite Doctor', hint: 'Check Node, npm, Python, Docker & Git' },
    { value: 'docker', label: 'Start Docker Infrastructure Only', hint: 'Launch PostgreSQL, Redis & LocalStack' },
    { value: 'python', label: 'Setup Python AI-Service Virtualenv', hint: 'Create apps/ai-service/.venv & install packages' },
    { value: 'db', label: 'Sync Database Schema & Generate Prisma', hint: 'Run prisma generate & db push' },
    { value: 'exit', label: 'Exit Setup', hint: 'Quit without making changes' },
  ]);

  if (action === 'full') {
    await runFullSetup(true);
  } else if (action === 'doctor') {
    checkAllPrereqs();
  } else if (action === 'docker') {
    await startDockerInfrastructure();
  } else if (action === 'python') {
    await setupPythonEnvironment();
  } else if (action === 'db') {
    await setupDatabase();
  } else {
    process.stdout.write(`\n  ${c.dim('Setup cancelled. Have a great day!')}\n\n`);
  }
}

main().catch((err) => {
  process.stderr.write(`\n${c.red('Fatal Setup Error:')} ${err.message}\n`);
  process.exit(1);
});
