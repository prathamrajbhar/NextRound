const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { printStep, printSection, createSpinner } = require('./ui');

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

  const spinner = createSpinner('Setting up Python virtual environment...');
  spinner.start();

  try {
    if (!fs.existsSync(VENV_DIR)) {
      spinner.update('Creating virtualenv at apps/ai-service/.venv...');
      const createRes = spawnSync(hostPython, ['-m', 'venv', '.venv'], {
        cwd: AI_SERVICE_DIR,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (createRes.status !== 0) {
        spinner.fail(`Failed to create virtual environment: ${createRes.stderr}`);
        return false;
      }
    }

    spinner.update('Upgrading pip & installing Python requirements...');
    const reqPath = path.join(AI_SERVICE_DIR, 'requirements.txt');

    if (fs.existsSync(reqPath)) {
      const pipRes = spawnSync(pipBin, ['install', '--upgrade', 'pip', '-r', 'requirements.txt'], {
        cwd: AI_SERVICE_DIR,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (pipRes.status !== 0) {
        spinner.fail(`Failed to install Python dependencies: ${pipRes.stderr}`);
        return false;
      }
    }

    spinner.succeed('Python virtual environment & packages configured successfully');
    printStep('success', 'FastAPI 0.141, LangGraph 1.2, GenAI & Groq SDKs installed in .venv');
    return true;
  } catch (err) {
    spinner.fail(`Python environment setup error: ${err.message}`);
    return false;
  }
}

module.exports = {
  setupPythonEnvironment,
  pythonBin,
  VENV_DIR,
};
