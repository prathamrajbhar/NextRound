const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { printStep, printSection } = require('./ui');
const { runTaskWithSpinner } = require('./runner');

const AI_SERVICE_DIR = path.resolve(__dirname, '..', '..', 'apps', 'ai-service');
const VENV_DIR = path.join(AI_SERVICE_DIR, '.venv');
const isWindows = process.platform === 'win32';

const pythonBin = isWindows
  ? path.join(VENV_DIR, 'Scripts', 'python.exe')
  : path.join(VENV_DIR, 'bin', 'python');

const pipBin = isWindows
  ? path.join(VENV_DIR, 'Scripts', 'pip.exe')
  : path.join(VENV_DIR, 'bin', 'pip');

function getHostPython() {
  const candidates = isWindows ? ['python', 'py', 'python3'] : ['python3', 'python'];
  for (const cmd of candidates) {
    const res = spawnSync(cmd, ['--version'], { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    if (res.status === 0) return cmd;
  }
  return null;
}

async function setupPythonEnvironment() {
  printSection('Python AI Service Environment (.venv)', '🐍');

  const hostPython = getHostPython();
  if (!hostPython) {
    printStep('error', 'Python executable not found. Please install Python 3.11+');
    return false;
  }

  if (!fs.existsSync(VENV_DIR)) {
    const { result: venvRes, spinner: venvSpinner } = await runTaskWithSpinner(
      'Creating virtualenv at apps/ai-service/.venv...',
      hostPython,
      ['-m', 'venv', '.venv'],
      { cwd: AI_SERVICE_DIR }
    );

    if (!venvRes.ok) {
      venvSpinner.fail(`Failed to create virtual environment: ${venvRes.stderr}`);
      return false;
    }
    venvSpinner.succeed('Python virtual environment created');
  } else {
    printStep('success', 'Virtual environment existing at apps/ai-service/.venv');
  }

  const reqPath = path.join(AI_SERVICE_DIR, 'requirements.txt');
  if (fs.existsSync(reqPath)) {
    const { result: pipRes, spinner: pipSpinner } = await runTaskWithSpinner(
      'Installing AI service dependencies from requirements.txt...',
      pipBin,
      ['install', '--upgrade', 'pip', '-r', 'requirements.txt'],
      { cwd: AI_SERVICE_DIR }
    );

    if (!pipRes.ok) {
      pipSpinner.fail(`Failed to install Python packages: ${pipRes.stderr}`);
      return false;
    }
    pipSpinner.succeed('Python packages installed in .venv (FastAPI, LangGraph, GenAI)');
  }

  return true;
}

module.exports = {
  setupPythonEnvironment,
  pythonBin,
  VENV_DIR,
};
