const { spawn } = require('node:child_process');
const { createSpinner, c } = require('./ui');

function runAsync(command, args = [], options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      ...options,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        const str = chunk.toString();
        stdout += str;
        if (options.onData) options.onData(str);
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        const str = chunk.toString();
        stderr += str;
        if (options.onData) options.onData(str);
      });
    }

    child.on('close', (code) => {
      resolve({
        code,
        status: code,
        stdout,
        stderr,
        ok: code === 0,
      });
    });

    child.on('error', (err) => {
      resolve({
        code: 1,
        status: 1,
        stdout,
        stderr: err.message,
        ok: false,
      });
    });
  });
}

async function runTaskWithSpinner(spinnerText, command, args = [], options = {}) {
  const spinner = createSpinner(spinnerText);
  spinner.start();

  const result = await runAsync(command, args, {
    ...options,
    onData: (chunk) => {
      const lines = chunk.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1].replace(/\x1b\[[0-9;]*m/g, '').trim();
        const cleanLine = lastLine.length > 45 ? `${lastLine.slice(0, 42)}...` : lastLine;
        spinner.update(`${spinnerText} ${c.gray(`[${cleanLine}]`)}`);
      }
    },
  });

  return { result, spinner };
}

module.exports = {
  runAsync,
  runTaskWithSpinner,
};
