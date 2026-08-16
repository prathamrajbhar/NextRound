const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';

const pythonBin = isWindows
  ? path.join(__dirname, '..', 'apps', 'ai-service', '.venv', 'Scripts', 'python.exe')
  : path.join(__dirname, '..', 'apps', 'ai-service', '.venv', 'bin', 'python');

const fallbackPython = isWindows ? 'python' : 'python3';
const executable = fs.existsSync(pythonBin) ? pythonBin : fallbackPython;

const mainPy = path.join(__dirname, '..', 'apps', 'ai-service', 'main.py');

const child = spawn(executable, [mainPy], {
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
