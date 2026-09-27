const { execSync } = require('node:child_process');
const { printStep, printSection } = require('./ui');

function getCommandOutput(cmd) {
  try {
    return execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function checkNode() {
  const version = process.version;
  const major = parseInt(version.replace('v', '').split('.')[0], 10);
  if (major < 20) {
    return { ok: false, name: 'Node.js', current: version, req: '>= 20.0.0', fix: 'Install Node.js 20+ via nvm or nodejs.org' };
  }
  return { ok: true, name: 'Node.js', current: version };
}

function checkNpm() {
  const version = getCommandOutput('npm -v');
  if (!version) {
    return { ok: false, name: 'npm', current: 'Missing', req: '>= 10.0.0', fix: 'Install npm with Node.js' };
  }
  return { ok: true, name: 'npm', current: `v${version}` };
}

function checkPython() {
  const raw = getCommandOutput('python3 --version') || getCommandOutput('python --version');
  if (!raw) {
    return {
      ok: false,
      name: 'Python 3',
      current: 'Missing',
      req: '>= 3.11',
      fix: 'Install Python 3.11+ (e.g. sudo apt install python3 python3-venv / brew install python@3.12)',
    };
  }
  const match = raw.match(/Python\s+([0-9.]+)/i);
  const version = match ? match[1] : raw;
  const parts = version.split('.').map(Number);
  if (parts[0] < 3 || (parts[0] === 3 && parts[1] < 10)) {
    return { ok: false, name: 'Python 3', current: raw, req: '>= 3.11', fix: 'Upgrade Python to 3.11 or newer' };
  }
  return { ok: true, name: 'Python 3', current: raw };
}

function checkDocker() {
  const version = getCommandOutput('docker --version');
  if (!version) {
    return { ok: false, name: 'Docker', current: 'Missing', req: 'Docker Engine', fix: 'Install Docker from https://docs.docker.com/get-docker/' };
  }
  const daemonOk = getCommandOutput('docker info');
  if (!daemonOk) {
    return {
      ok: false,
      name: 'Docker Daemon',
      current: 'Not Running',
      req: 'Running Daemon',
      fix: 'Start the Docker daemon (e.g. sudo systemctl start docker or launch Docker Desktop)',
    };
  }
  return { ok: true, name: 'Docker Engine', current: version.replace('Docker version ', 'v') };
}

function checkDockerCompose() {
  const version = getCommandOutput('docker compose version');
  if (!version) {
    return { ok: false, name: 'Docker Compose', current: 'Missing', req: 'v2+', fix: 'Install Docker Compose v2 plugin' };
  }
  return { ok: true, name: 'Docker Compose', current: version };
}

function checkGit() {
  const version = getCommandOutput('git --version');
  if (!version) {
    return { ok: false, name: 'Git', current: 'Missing', req: 'git', fix: 'Install git' };
  }
  return { ok: true, name: 'Git', current: version.replace('git version ', 'v') };
}

function checkAllPrereqs() {
  printSection('System Prerequisites & Health Doctor', '🩺');
  const checks = [
    checkNode(),
    checkNpm(),
    checkPython(),
    checkDocker(),
    checkDockerCompose(),
    checkGit(),
  ];

  let allPassed = true;
  for (const item of checks) {
    if (item.ok) {
      printStep('success', `${item.name.padEnd(16)} : ${item.current}`);
    } else {
      allPassed = false;
      printStep('error', `${item.name.padEnd(16)} : ${item.current}`, item.fix);
    }
  }

  return { ok: allPassed, results: checks };
}

module.exports = {
  checkAllPrereqs,
  getCommandOutput,
};
