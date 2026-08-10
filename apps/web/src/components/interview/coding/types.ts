export interface TestResult {
  name: string;
  input: string;
  expected: string;
  actual: string;
  status: 'passed' | 'failed';
  time: string;
}
