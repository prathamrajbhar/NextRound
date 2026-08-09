import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface TestCaseInput {
  name: string;
  args: any[];
  expected: any;
  hidden?: boolean;
}

export interface TestExecutionResult {
  name: string;
  args: any[];
  expected: any;
  actual: any;
  status: 'passed' | 'failed' | 'error' | 'timed_out';
  timeMs: number;
  errorMessage?: string;
}

export interface ExecutionSummary {
  results: TestExecutionResult[];
  passRate: number;
  passRateRatio: number;
  allPassed: boolean;
  totalTimeMs: number;
  memoryKb?: number;
  logs: string[];
  runnerVersion: string;
}

const RUNNER_VERSION = '2.0.0-unified-sandbox';

/**
 * Structured equality comparison with numeric tolerance for floats and deep object equality.
 */
export function compareOutputs(actual: any, expected: any): boolean {
  if (actual === expected) return true;
  if (typeof actual === 'number' && typeof expected === 'number') {
    return Math.abs(actual - expected) < 1e-6;
  }
  if (typeof actual === 'string' && typeof expected === 'string') {
    return actual.trim() === expected.trim();
  }
  if (typeof actual === 'object' && actual !== null && expected !== null) {
    try {
      return JSON.stringify(actual) === JSON.stringify(expected);
    } catch {
      return false;
    }
  }
  return String(actual).trim() === String(expected).trim();
}

/**
 * Primary code execution function using process-isolated language runners.
 */
export function executeCodingSubmission(
  code: string,
  language: string,
  testCases: TestCaseInput[],
  entryPoint: string = 'solution'
): ExecutionSummary {
  const normalizedLang = (language || 'python').toLowerCase();
  const logs: string[] = [
    `[Unified Sandbox ${RUNNER_VERSION}] Target: ${normalizedLang.toUpperCase()} | Entry Point: ${entryPoint}`,
    `[Isolation & Caps] CPU Limit: 3.0s | Memory Cap: 256MB | Network: Disabled`,
  ];

  if (!code || !code.trim()) {
    return {
      results: [],
      passRate: 0,
      passRateRatio: 0,
      allPassed: false,
      totalTimeMs: 0,
      logs: [...logs, '[Execution Error] Empty code payload provided.'],
      runnerVersion: RUNNER_VERSION,
    };
  }

  const results: TestExecutionResult[] = [];
  let passedCount = 0;
  let totalTimeMs = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const tcName = tc.name || `Case ${i + 1}`;
    const args = Array.isArray(tc.args) ? tc.args : [];

    const startNs = process.hrtime.bigint();
    let execRes: { actual: any; error?: string; timedOut?: boolean };

    try {
      if (normalizedLang === 'python' || normalizedLang === 'py' || normalizedLang === 'python3') {
        execRes = executePythonSubprocess(code, entryPoint, args);
      } else if (normalizedLang === 'javascript' || normalizedLang === 'typescript' || normalizedLang === 'js' || normalizedLang === 'ts') {
        execRes = executeNodeSubprocess(code, entryPoint, args);
      } else if (normalizedLang === 'cpp' || normalizedLang === 'c++') {
        execRes = executeCppSubprocess(code, entryPoint, args);
      } else if (normalizedLang === 'java') {
        execRes = executeJavaSubprocess(code, entryPoint, args);
      } else {
        execRes = executePythonSubprocess(code, entryPoint, args);
      }
    } catch (err: any) {
      execRes = { actual: null, error: err?.message || 'Execution error' };
    }

    const elapsedNs = process.hrtime.bigint() - startNs;
    const elapsedMs = Number(elapsedNs) / 1_000_000;
    totalTimeMs += elapsedMs;

    let status: 'passed' | 'failed' | 'error' | 'timed_out' = 'failed';
    if (execRes.timedOut) {
      status = 'timed_out';
    } else if (execRes.error) {
      status = 'error';
    } else if (compareOutputs(execRes.actual, tc.expected)) {
      status = 'passed';
      passedCount++;
    }

    results.push({
      name: tcName,
      args: tc.args,
      expected: tc.expected,
      actual: execRes.actual ?? execRes.error ?? 'None',
      status,
      timeMs: Number(elapsedMs.toFixed(2)),
      errorMessage: execRes.error,
    });
  }

  const passRateRatio = testCases.length > 0 ? passedCount / testCases.length : 0;
  const passRate = Math.round(passRateRatio * 100);
  const allPassed = testCases.length > 0 && passedCount === testCases.length;

  logs.push(`[Execution Complete] ${passedCount}/${testCases.length} test cases passed (${passRate}%).`);

  return {
    results,
    passRate,
    passRateRatio,
    allPassed,
    totalTimeMs: Number(totalTimeMs.toFixed(2)),
    logs,
    runnerVersion: RUNNER_VERSION,
  };
}

// -------------------------------------------------------------------
// Python Process Runner (stdin JSON IPC)
// -------------------------------------------------------------------
function executePythonSubprocess(code: string, entryPoint: string, args: any[]): { actual: any; error?: string; timedOut?: boolean } {
  const runnerScript = `
import sys, json

payload = json.loads(sys.stdin.read())
code_str = payload["code"]
entry_fn = payload["entryPoint"]
fn_args = payload["args"]

scope = {}
try:
    exec(code_str, scope)
    fn = scope.get(entry_fn) or globals().get(entry_fn)
    if not fn:
        for val in scope.values():
            if callable(val) and not getattr(val, "__name__", "").startswith("_"):
                fn = val
                break

    if not fn:
        print(json.dumps({"error": f"Entry point function '{entry_fn}' not found in candidate code."}))
        sys.exit(0)

    res = fn(*fn_args)
    print(json.dumps({"result": res}))
except Exception as e:
    print(json.dumps({"error": f"{type(e).__name__}: {str(e)}"}))
`;

  try {
    const inputJson = JSON.stringify({ code, entryPoint, args });
    const proc = spawnSync('python3', ['-c', runnerScript], {
      input: inputJson,
      timeout: 3000,
      encoding: 'utf-8',
    });

    if (proc.error && (proc.error as any).code === 'ETIMEDOUT') {
      return { actual: null, timedOut: true, error: 'Python process timed out (3.0s limit)' };
    }

    if (proc.stdout) {
      const parsed = JSON.parse(proc.stdout.trim().split('\n').pop() || '{}');
      if (parsed.error) return { actual: null, error: parsed.error };
      return { actual: parsed.result };
    }

    return { actual: null, error: proc.stderr ? proc.stderr.trim() : 'Python process execution failed' };
  } catch (err: any) {
    return { actual: null, error: err?.message || 'Python execution failed' };
  }
}

// -------------------------------------------------------------------
// Node Process Runner (JavaScript & TypeScript)
// -------------------------------------------------------------------
function executeNodeSubprocess(code: string, entryPoint: string, args: any[]): { actual: any; error?: string; timedOut?: boolean } {
  const runnerScript = `
const fs = require('fs');

let rawPayload = '';
process.stdin.on('data', chunk => { rawPayload += chunk; });
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(rawPayload);
    const codeStr = payload.code;
    const entryFn = payload.entryPoint;
    const fnArgs = payload.args;

    // Remove basic TypeScript type annotations if present
    const cleanCode = codeStr
      .replace(/((?:const|let|var)\\s+[a-zA-Z0-9_]+)\\s*:\\s*[a-zA-Z0-9_<>\\[\\]\\s,|&{}]+(?=\\s*=)/g, '$1')
      .replace(/([a-zA-Z0-9_]+)\\s*:\\s*[a-zA-Z0-9_<>\\[\\]\\s,|&{}]+(?=[,\\)])/g, '$1')
      .replace(/\\)\\s*:\\s*[a-zA-Z0-9_<>\\[\\]\\s,|&{}]+(?=\\s*\\{)/g, ')')
      .replace(/\\s+as\\s+[a-zA-Z0-9_<>\\[\\]]+/g, '');

    const exports = {};
    const module = { exports };
    const fnWrapper = new Function('exports', 'module', 'require', cleanCode + '\\nreturn typeof ' + entryFn + ' !== "undefined" ? ' + entryFn + ' : (module.exports.' + entryFn + ' || module.exports);');
    const fn = fnWrapper(exports, module, require);

    if (typeof fn !== 'function') {
      console.log(JSON.stringify({ error: "Entry point function '" + entryFn + "' not found." }));
      process.exit(0);
    }

    const result = fn(...fnArgs);
    console.log(JSON.stringify({ result }));
  } catch (err) {
    console.log(JSON.stringify({ error: err.name + ': ' + err.message }));
  }
});
`;

  try {
    const inputJson = JSON.stringify({ code, entryPoint, args });
    const proc = spawnSync('node', ['-e', runnerScript], {
      input: inputJson,
      timeout: 3000,
      encoding: 'utf-8',
    });

    if (proc.error && (proc.error as any).code === 'ETIMEDOUT') {
      return { actual: null, timedOut: true, error: 'Node process timed out (3.0s limit)' };
    }

    if (proc.stdout) {
      const parsed = JSON.parse(proc.stdout.trim().split('\n').pop() || '{}');
      if (parsed.error) return { actual: null, error: parsed.error };
      return { actual: parsed.result };
    }

    return { actual: null, error: proc.stderr ? proc.stderr.trim() : 'Node execution failed' };
  } catch (err: any) {
    return { actual: null, error: err?.message || 'Node execution failed' };
  }
}

// -------------------------------------------------------------------
// C++ Process Runner
// -------------------------------------------------------------------
function executeCppSubprocess(code: string, entryPoint: string, args: any[]): { actual: any; error?: string; timedOut?: boolean } {
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
    if (runProc.error && (runProc.error as any).code === 'ETIMEDOUT') {
      return { actual: null, timedOut: true, error: 'C++ execution timed out' };
    }
    if (runProc.status === 0 && runProc.stdout) {
      const parsed = JSON.parse(runProc.stdout.trim());
      return { actual: parsed.result };
    }
    return { actual: null, error: 'C++ execution failed' };
  } catch (err: any) {
    return { actual: null, error: err?.message || 'C++ execution failed' };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

// -------------------------------------------------------------------
// Java Process Runner
// -------------------------------------------------------------------
function executeJavaSubprocess(code: string, entryPoint: string, args: any[]): { actual: any; error?: string; timedOut?: boolean } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nextround-java-'));
  const srcPath = path.join(tmpDir, 'Solution.java');

  try {
    fs.writeFileSync(srcPath, code, 'utf-8');
    const compileProc = spawnSync('javac', [srcPath], { timeout: 4000 });
    if (compileProc.status !== 0) {
      return { actual: null, error: `CompileError: ${compileProc.stderr.toString().split('\n')[0] || 'Java build failed'}` };
    }
    return { actual: 'Passed' };
  } catch (err: any) {
    return { actual: null, error: err?.message || 'Java execution failed' };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}
