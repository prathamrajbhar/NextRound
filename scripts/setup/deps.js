const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { printStep, printSection, createSpinner, c } = require('./ui');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function checkNodeModulesExist() {
  const rootModules = path.join(ROOT_DIR, 'node_modules');
  const turboBin = path.join(rootModules, 'turbo');
  return fs.existsSync(rootModules) && fs.existsSync(turboBin);
}

function runNpmInstallCommand(args = []) {
  return spawnSync('npm', ['install', ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, npm_config_audit: 'false', npm_config_fund: 'false' },
  });
}

async function installNodeDeps(force = false) {
  printSection('Monorepo Node Dependencies', '📦');

  if (!force && checkNodeModulesExist()) {
    printStep('success', 'node_modules already present and initialized', 'skipping full re-install');
    return true;
  }

  const spinner = createSpinner('Installing npm workspace packages...');
  spinner.start();

  try {
    // Attempt 1: Standard npm install
    let res = runNpmInstallCommand();

    if (res.status === 0) {
      spinner.succeed('Monorepo Node dependencies installed successfully');
      return true;
    }

    const errorOutput = `${res.stderr || ''} ${res.stdout || ''}`;

    // Attempt 2: Handle EALLOWSCRIPTS or script restriction by using --ignore-scripts
    if (errorOutput.includes('EALLOWSCRIPTS') || errorOutput.includes('allow-scripts') || errorOutput.includes('lifecycle script')) {
      spinner.update('Retrying with --ignore-scripts to bypass environment script restrictions...');
      res = runNpmInstallCommand(['--ignore-scripts']);

      if (res.status === 0) {
        spinner.succeed('Node dependencies installed (scripts bypassed for compatibility)');
        return true;
      }
    }

    // Attempt 3: Handle peer dependency conflicts with --legacy-peer-deps
    spinner.update('Retrying with --legacy-peer-deps --ignore-scripts...');
    res = runNpmInstallCommand(['--legacy-peer-deps', '--ignore-scripts']);

    if (res.status === 0) {
      spinner.succeed('Node dependencies installed (legacy-peer-deps mode)');
      return true;
    }

    spinner.fail(`npm install failed: ${res.stderr || res.stdout}`);
    printStep('error', 'Dependency installation failed', 'Try running: npm install --ignore-scripts');
    return false;
  } catch (err) {
    spinner.fail(`npm install encountered error: ${err.message}`);
    return false;
  }
}

module.exports = {
  installNodeDeps,
  checkNodeModulesExist,
};
