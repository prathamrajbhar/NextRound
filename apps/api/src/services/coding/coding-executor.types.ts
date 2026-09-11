export interface TestCaseInput {
  name: string;
  args: unknown[];
  expected: unknown;
  hidden?: boolean;
}

export interface TestExecutionResult {
  name: string;
  args: unknown[];
  expected: unknown;
  actual: unknown;
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

export interface SubprocessExecutionResult {
  actual: unknown;
  error?: string;
  timedOut?: boolean;
}

export function compareOutputs(actual: unknown, expected: unknown): boolean {
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
