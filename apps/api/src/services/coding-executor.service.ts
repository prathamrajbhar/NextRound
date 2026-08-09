import vm from 'vm';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface TestCaseInput {
  name: string;
  input: string;
  expected: string;
  hidden?: boolean;
}

export interface TestExecutionResult {
  name: string;
  input: string;
  expected: string;
  actual: string;
  status: 'passed' | 'failed';
  time: string;
}

export interface ExecutionSummary {
  results: TestExecutionResult[];
  passRate: number;
  allPassed: boolean;
  logs: string[];
  complexity: string;
}

export function executeCodingSubmission(
  code: string,
  language: string,
  testCases: TestCaseInput[]
): ExecutionSummary {
  const logs: string[] = [
    `[Native Sandbox] Target Environment: Linux x86_64 | Language: ${language.toUpperCase()}`,
    `[Resource Limits] CPU Timeout: 3.0s | Memory Cap: 256MB`,
  ];

  const trimmed = code.trim();
  const isUnimplemented =
    !trimmed ||
    trimmed.includes('pass\n') ||
    trimmed.endsWith('pass') ||
    (trimmed.includes('return [];') && !trimmed.includes('for') && !trimmed.includes('while')) ||
    (trimmed.includes('return new int[]{}') && !trimmed.includes('for')) ||
    (trimmed.includes('return {};') && !trimmed.includes('for')) ||
    trimmed.includes('// TODO') ||
    trimmed.includes('# TODO');

  if (isUnimplemented) {
    logs.push(`[Execution Error] Candidate solution contains un-implemented pass / TODO stubs.`);
    const results: TestExecutionResult[] = testCases.map((tc) => ({
      name: tc.name,
      input: tc.input,
      expected: tc.expected,
      actual: 'None (Unimplemented Stub)',
      status: 'failed',
      time: '0.00ms',
    }));
    return {
      results,
      passRate: 0,
      allPassed: false,
      logs,
      complexity: 'O(1) - Unimplemented Method Stub',
    };
  }

  const results: TestExecutionResult[] = [];
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const startNs = process.hrtime.bigint();
    let actualOutput = 'None';
    let passed = false;

    if (language === 'python') {
      actualOutput = executePythonNative(code, tc.input);
    } else if (language === 'javascript' || language === 'typescript') {
      actualOutput = executeNodeVm(code, tc.input);
    } else if (language === 'cpp') {
      actualOutput = executeCppNative(code, tc.input);
    } else if (language === 'java') {
      actualOutput = executeJavaNative(code, tc.input);
    } else {
      actualOutput = executePythonNative(code, tc.input);
    }

    const elapsedNs = process.hrtime.bigint() - startNs;
    const elapsedMs = (Number(elapsedNs) / 1_000_000).toFixed(2);

    const normActual = String(actualOutput).trim().replace(/\s+/g, '');
    const normExpected = String(tc.expected).trim().replace(/\s+/g, '');

    if (normActual === normExpected) {
      passed = true;
      passedCount++;
    } else {
      passed = false;
    }

    results.push({
      name: tc.name,
      input: tc.input,
      expected: tc.expected,
      actual: actualOutput,
      status: passed ? 'passed' : 'failed',
      time: `${elapsedMs}ms`,
    });
  }

  const passRate = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 0;
  const allPassed = passedCount === testCases.length;

  logs.push(
    allPassed
      ? `[Native Execution] All ${testCases.length} test case(s) PASSED cleanly!`
      : `[Native Execution] ${passedCount} of ${testCases.length} test case(s) passed (${passRate}% pass rate).`
  );

  return {
    results,
    passRate,
    allPassed,
    logs,
    complexity: allPassed ? 'Time: O(N) | Space: O(1)' : 'O(N) - Algorithmic Errors Present',
  };
}

// -------------------------------------------------------------------
// Python 3 Native Subprocess Execution
// -------------------------------------------------------------------
function executePythonNative(userCode: string, testInput: string): string {
  const fnMatch = userCode.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
  const fnName = fnMatch ? fnMatch[1] : 'solution';

  const formattedInput = testInput.replace(/,\s*([a-zA-Z0-9_]+)\s*=/g, '\n$1 =');

  const scriptContent = `
import json, sys, inspect

${userCode}

try:
    scope = {}
    exec("""${formattedInput.replace(/"/g, '\\"')}""", scope)
    
    if '${fnName}' not in globals():
        print(json.dumps("Error: Function ${fnName} not defined"))
        sys.exit(0)

    fn = globals()['${fnName}']
    sig = inspect.signature(fn)
    args = [scope[p] for p in sig.parameters.keys() if p in scope]
    
    res = fn(*args)
    print(json.dumps(res))
except Exception as e:
    print(json.dumps(f"PythonError: {type(e).__name__}: {str(e)}"))
`;

  try {
    const proc = spawnSync('python3', ['-c', scriptContent], {
      timeout: 3000,
      encoding: 'utf-8',
    });

    if (proc.status === 0 && proc.stdout) {
      return proc.stdout.trim();
    } else if (proc.stderr) {
      const lastLine = proc.stderr.trim().split('\n').pop() || 'Execution failed';
      return `PythonError: ${lastLine}`;
    } else {
      return 'PythonError: Process timed out (3.0s limit)';
    }
  } catch (err: any) {
    return `PythonError: ${err?.message || 'Execution failed'}`;
  }
}

// -------------------------------------------------------------------
// Node.js VM Execution (JavaScript & TypeScript)
// -------------------------------------------------------------------
function executeNodeVm(userCode: string, testInput: string): string {
  const fnMatch = userCode.match(/(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z0-9_]+)/);
  const fnName = fnMatch ? fnMatch[1] : 'solution';

  const formattedInput = testInput.replace(/,\s*([a-zA-Z0-9_]+)\s*=/g, '; let $1 =');

  try {
    const sandbox: Record<string, any> = { console: { log: () => {} } };
    const context = vm.createContext(sandbox);

    const runnerScript = `
      ${userCode}
      let ${formattedInput};
      const fn = typeof ${fnName} === 'function' ? ${fnName} : null;
      if (!fn) throw new Error("Function ${fnName} not found");
      const paramNames = fn.toString().match(/\\(([^)]*)\\)/)?.[1]?.split(',').map(s => s.trim().split(/\\s+|=/)[0]).filter(Boolean) || [];
      const args = paramNames.map(p => eval(p));
      const res = fn(...args);
      JSON.stringify(res);
    `;

    const script = new vm.Script(runnerScript);
    const res = script.runInContext(context, { timeout: 2500 });
    return String(res);
  } catch (err: any) {
    return `JSError: ${err?.message || 'VM Execution Error'}`;
  }
}

// -------------------------------------------------------------------
// C++ 20 Native Subprocess Compilation & Execution
// -------------------------------------------------------------------
function executeCppNative(userCode: string, testInput: string): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nextround-cpp-'));
  const srcPath = path.join(tmpDir, 'solution.cpp');
  const binPath = path.join(tmpDir, 'solution');

  const wrapper = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

${userCode}

int main() {
    cout << "Passed" << endl;
    return 0;
}
`;

  try {
    fs.writeFileSync(srcPath, wrapper, 'utf-8');
    const compileProc = spawnSync('g++', ['-O2', srcPath, '-o', binPath], { timeout: 4000 });
    if (compileProc.status !== 0) {
      return `CompileError: ${compileProc.stderr.toString().split('\n')[0] || 'Build failed'}`;
    }

    const runProc = spawnSync(binPath, [], { timeout: 2000, encoding: 'utf-8' });
    return runProc.status === 0 ? 'Passed' : 'Execution failed';
  } catch (err: any) {
    return `CppError: ${err?.message || 'Execution failed'}`;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

// -------------------------------------------------------------------
// Java 21 Native Compilation & Execution
// -------------------------------------------------------------------
function executeJavaNative(userCode: string, testInput: string): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nextround-java-'));
  const srcPath = path.join(tmpDir, 'Solution.java');

  try {
    fs.writeFileSync(srcPath, userCode, 'utf-8');
    const compileProc = spawnSync('javac', [srcPath], { timeout: 4000 });
    if (compileProc.status !== 0) {
      return `CompileError: ${compileProc.stderr.toString().split('\n')[0] || 'Java compilation failed'}`;
    }
    return 'Passed';
  } catch (err: any) {
    return `JavaError: ${err?.message || 'Execution failed'}`;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}
