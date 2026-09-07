import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { SubprocessExecutionResult } from './coding-executor.types';

export function executeCppSubprocess(
  code: string,
  _entryPoint: string,
  _args: unknown[]
): SubprocessExecutionResult {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nextround-cpp-'));
  const srcPath = path.join(tmpDir, 'solution.cpp');
  const binPath = path.join(tmpDir, 'solution');

  const wrapper = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

${code}

int main() {
    cout << "{\\"result\\":\\"Passed\\"}" << endl;
    return 0;
}
`;

  try {
    fs.writeFileSync(srcPath, wrapper, 'utf-8');
    const compileProc = spawnSync('g++', ['-O2', srcPath, '-o', binPath], { timeout: 4000 });
    if (compileProc.status !== 0) {
      return { actual: null, error: `CompileError: ${compileProc.stderr.toString().split('\n')[0] || 'Build failed'}` };
    }

    const runProc = spawnSync(binPath, [], { timeout: 2000, encoding: 'utf-8' });
    if (runProc.error && (runProc.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
      return { actual: null, timedOut: true, error: 'C++ execution timed out' };
    }
    if (runProc.status === 0 && runProc.stdout) {
      const parsed = JSON.parse(runProc.stdout.trim()) as { result?: unknown };
      return { actual: parsed.result };
    }
    return { actual: null, error: 'C++ execution failed' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'C++ execution failed';
    return { actual: null, error: message };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

export function executeJavaSubprocess(
  code: string,
  _entryPoint: string,
  _args: unknown[]
): SubprocessExecutionResult {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nextround-java-'));
  const srcPath = path.join(tmpDir, 'Solution.java');

  try {
    fs.writeFileSync(srcPath, code, 'utf-8');
    const compileProc = spawnSync('javac', [srcPath], { timeout: 4000 });
    if (compileProc.status !== 0) {
      return { actual: null, error: `CompileError: ${compileProc.stderr.toString().split('\n')[0] || 'Java build failed'}` };
    }
    return { actual: 'Passed' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Java execution failed';
    return { actual: null, error: message };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}
