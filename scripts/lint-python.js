const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';
const aiServiceDir = path.join(__dirname, '..', 'apps', 'ai-service');

const ruffBin = isWindows
  ? path.join(aiServiceDir, '.venv', 'Scripts', 'ruff.exe')
  : path.join(aiServiceDir, '.venv', 'bin', 'ruff');

const pythonBin = isWindows
  ? path.join(aiServiceDir, '.venv', 'Scripts', 'python.exe')
  : path.join(aiServiceDir, '.venv', 'bin', 'python');

const pythonExecutable = fs.existsSync(pythonBin) ? pythonBin : (isWindows ? 'python' : 'python3');

console.log('🔍 Checking Python code in apps/ai-service...');

if (fs.existsSync(ruffBin)) {
  console.log('⚡ Running Ruff syntax & undefined check (E9, F821, F841)...');
  const ruffRes = spawnSync(ruffBin, ['check', aiServiceDir, '--select', 'E9,F821,F841'], {
    stdio: 'inherit',
  });
  if (ruffRes.status !== 0) {
    process.exit(ruffRes.status || 1);
  }
}

console.log('⚡ Compiling Python files to verify syntax...');
function getPythonFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === '.venv' || file === '__pycache__' || file === '.pytest_cache' || file === '.ruff_cache') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getPythonFiles(fullPath));
    } else if (file.endsWith('.py')) {
      results.push(fullPath);
    }
  }
  return results;
}

const pyFiles = getPythonFiles(aiServiceDir);
const compileRes = spawnSync(pythonExecutable, ['-m', 'py_compile', ...pyFiles], {
  stdio: 'inherit',
});

if (compileRes.status !== 0) {
  process.exit(compileRes.status || 1);
}

console.log(`✅ All ${pyFiles.length} Python files checked and compiled cleanly!`);
process.exit(0);
