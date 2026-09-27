const fs = require('node:fs');
const path = require('node:path');
const { printStep, printSection, c } = require('./ui');
const { runAsync, runTaskWithSpinner } = require('./runner');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function checkNodeModulesExist() {
  const rootModules = path.join(ROOT_DIR, 'node_modules');
  const turboBin = path.join(rootModules, 'turbo');
  return fs.existsSync(rootModules) && fs.existsSync(turboBin);
}

async function installNodeDeps(force = false) {
  printSection('Monorepo Node Dependencies', '📦');

  if (!force && checkNodeModulesExist()) {
    printStep('success', 'node_modules already present and initialized', 'skipping full re-install');
    return true;
  }

  const baseEnv = { ...process.env, npm_config_audit: 'false', npm_config_fund: 'false' };

  // Attempt 1: Standard npm install with live spinner
  const { result: res1, spinner } = await runTaskWithSpinner(
    'Installing npm workspace packages...',
    'npm',
    ['install'],
    { cwd: ROOT_DIR, env: baseEnv }
  );

  if (res1.ok) {
    spinner.succeed('Monorepo Node dependencies installed successfully');
    return true;
  }

  const errorOutput = `${res1.stderr || ''} ${res1.stdout || ''}`;

  // Attempt 2: Handle EALLOWSCRIPTS or script restriction by using --ignore-scripts
  if (errorOutput.includes('EALLOWSCRIPTS') || errorOutput.includes('allow-scripts') || errorOutput.includes('lifecycle script')) {
    spinner.update('Retrying with --ignore-scripts to bypass environment script restrictions...');
    const res2 = await runAsync('npm', ['install', '--ignore-scripts'], { cwd: ROOT_DIR, env: baseEnv });

    if (res2.ok) {
      spinner.succeed('Node dependencies installed (scripts bypassed for compatibility)');
      return true;
    }
  }

  // Attempt 3: Handle peer dependency conflicts with --legacy-peer-deps
  spinner.update('Retrying with --legacy-peer-deps --ignore-scripts...');
  const res3 = await runAsync('npm', ['install', '--legacy-peer-deps', '--ignore-scripts'], { cwd: ROOT_DIR, env: baseEnv });

  if (res3.ok) {
    spinner.succeed('Node dependencies installed (legacy-peer-deps mode)');
    return true;
  }

  spinner.fail(`npm install failed: ${res3.stderr || res3.stdout}`);
  printStep('error', 'Dependency installation failed', 'Try running: npm install --ignore-scripts');
  return false;
}

module.exports = {
  installNodeDeps,
  checkNodeModulesExist,
};
