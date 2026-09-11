import type {
  TestCaseInput,
  TestExecutionResult,
  ExecutionSummary,
  SubprocessExecutionResult,
} from './coding-executor.types';
import { compareOutputs } from './coding-executor.types';
import {
  executePythonSubprocess,
  executeNodeSubprocess,
  executeCppSubprocess,
  executeJavaSubprocess,
} from './coding-languages.service';

export * from './coding-executor.types';

const RUNNER_VERSION = '2.0.0-unified-sandbox';

function runSubprocess(
  normalizedLang: string,
  code: string,
  entryPoint: string,
  args: unknown[]
): SubprocessExecutionResult {
  if (normalizedLang === 'python' || normalizedLang === 'py' || normalizedLang === 'python3') {
    return executePythonSubprocess(code, entryPoint, args);
  }
  if (normalizedLang === 'javascript' || normalizedLang === 'typescript' || normalizedLang === 'js' || normalizedLang === 'ts') {
    return executeNodeSubprocess(code, entryPoint, args);
  }
  if (normalizedLang === 'cpp' || normalizedLang === 'c++') {
    return executeCppSubprocess(code, entryPoint, args);
  }
  if (normalizedLang === 'java') {
    return executeJavaSubprocess(code, entryPoint, args);
  }
  return executePythonSubprocess(code, entryPoint, args);
}

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

  for (let index = 0; index < testCases.length; index++) {
    const testCase = testCases[index];
    const testCaseName = testCase.name || `Case ${index + 1}`;
    const args = Array.isArray(testCase.args) ? testCase.args : [];

    const startNs = process.hrtime.bigint();
    let executionResult: SubprocessExecutionResult;

    try {
      executionResult = runSubprocess(normalizedLang, code, entryPoint, args);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Execution error';
      executionResult = { actual: null, error: message };
    }

    const elapsedNs = process.hrtime.bigint() - startNs;
    const elapsedMs = Number(elapsedNs) / 1_000_000;
    totalTimeMs += elapsedMs;

    let status: 'passed' | 'failed' | 'error' | 'timed_out' = 'failed';
    if (executionResult.timedOut) {
      status = 'timed_out';
    } else if (executionResult.error) {
      status = 'error';
    } else if (compareOutputs(executionResult.actual, testCase.expected)) {
      status = 'passed';
      passedCount++;
    }

    results.push({
      name: testCaseName,
      args: testCase.args,
      expected: testCase.expected,
      actual: executionResult.actual ?? executionResult.error ?? 'None',
      status,
      timeMs: Number(elapsedMs.toFixed(2)),
      errorMessage: executionResult.error,
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
