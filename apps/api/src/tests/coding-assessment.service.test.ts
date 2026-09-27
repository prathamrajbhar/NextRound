import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectCodingProblem, SelectCodingOptions } from '../services/coding/coding-bank.service';
import { prisma } from '../lib/prisma';
import { badRequest } from '../lib/http-errors';
import { shuffleInPlace } from '../services/questions/question-bank.helpers';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../lib/prisma', () => ({
  prisma: {
    codingProblem: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../services/questions/question-bank.helpers', () => ({
  shuffleInPlace: vi.fn((arr: unknown[]) => arr),
}));

import { checkCompleteness, generateCodingSubmissionSummary } from '../services/coding/coding-compiled.service';
import { executeCodingSubmission } from '../services/coding/code-executor.service';

// ---------------------------------------------------------------------------
// Problem selection
// ---------------------------------------------------------------------------

describe('Coding Bank — selectCodingProblem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProblem = {
    id: 'prob-001',
    slug: 'two-sum',
    title: 'Two Sum',
    category: 'algorithms',
    difficulty: 'easy',
    description: 'Given an array of integers, return indices of the two numbers...',
    starter_code: {
      javascript: 'function twoSum(nums, target) {\n  // your code\n}',
      python: 'def two_sum(nums, target):\n    pass',
    },
    public_tests: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], description: 'Basic case' },
      { input: [[3, 2, 4], 6], expected: [1, 2], description: 'No duplicates' },
    ],
    hidden_tests: [
      { input: [[1, 1, 1, 1], 2], expected: [0, 1] },
    ],
  };

  it('returns a random active problem with combined test cases', async () => {
    (prisma.codingProblem.findMany as vi.Mock).mockResolvedValue([mockProblem]);
    (shuffleInPlace as vi.Mock).mockReturnValue([mockProblem]);

    const result = await selectCodingProblem({ difficulty: 'easy', category: 'algorithms' });

    expect(result.id).toBe('prob-001');
    expect(result.slug).toBe('two-sum');
    expect(result.difficulty).toBe('easy');
    expect(result.category).toBe('algorithms');
    expect(result.starterCode).toHaveProperty('javascript');
    expect(result.starterCode).toHaveProperty('python');
    expect(result.testCases).toHaveLength(3); // 2 public + 1 hidden
    expect(result.testCases[0].hidden).toBe(false);
    expect(result.testCases[2].hidden).toBe(true);
  });

  it('returns a problem without category filter', async () => {
    (prisma.codingProblem.findMany as vi.Mock).mockResolvedValue([mockProblem]);
    (shuffleInPlace as vi.Mock).mockReturnValue([mockProblem]);

    const result = await selectCodingProblem({ difficulty: 'easy' });

    expect(result.id).toBe('prob-001');
    expect(result.category).toBe('algorithms');
  });

  it('returns a problem without difficulty filter', async () => {
    (prisma.codingProblem.findMany as vi.Mock).mockResolvedValue([mockProblem]);
    (shuffleInPlace as vi.Mock).mockReturnValue([mockProblem]);

    const result = await selectCodingProblem({ category: 'algorithms' });

    expect(result.id).toBe('prob-001');
  });

  it('returns a problem with no filters', async () => {
    (prisma.codingProblem.findMany as vi.Mock).mockResolvedValue([mockProblem]);
    (shuffleInPlace as vi.Mock).mockReturnValue([mockProblem]);

    const result = await selectCodingProblem({});

    expect(result.id).toBe('prob-001');
  });

  it('throws badRequest when no active problems in pool', async () => {
    (prisma.codingProblem.findMany as vi.Mock).mockResolvedValue([]);

    await expect(selectCodingProblem({ difficulty: 'hard', category: 'dp' })).rejects.toBeInstanceOf(
      badRequest.constructor
    );
    await expect(selectCodingProblem({ difficulty: 'hard', category: 'dp' })).rejects.toThrow(
      'No active coding problems found'
    );
    await expect(selectCodingProblem({ difficulty: 'hard', category: 'dp' })).rejects.toThrow(
      'at difficulty "hard"'
    );
    await expect(selectCodingProblem({ difficulty: 'hard', category: 'dp' })).rejects.toThrow(
      'in category "dp"'
    );
  });

  it('throws badRequest when pool empty without filters', async () => {
    (prisma.codingProblem.findMany as vi.Mock).mockResolvedValue([]);

    await expect(selectCodingProblem()).rejects.toThrow('No active coding problems found');
    await expect(selectCodingProblem()).rejects.not.toThrow('at difficulty');
    await expect(selectCodingProblem()).rejects.not.toThrow('in category');
  });

  it('only queries is_active=true problems', async () => {
    (prisma.codingProblem.findMany as vi.Mock).mockResolvedValue([mockProblem]);

    await selectCodingProblem({ difficulty: 'easy' });

    expect(prisma.codingProblem.findMany).toHaveBeenCalledWith({
      where: {
        is_active: true,
        difficulty: 'easy',
        category: 'algorithms',
      },
      take: 50,
    });
  });

  it('takes max 50 problems from the pool', async () => {
    const largePool = Array.from({ length: 100 }, (_, i) => ({
      id: `prob-${i}`,
      slug: `problem-${i}`,
      title: `Problem ${i}`,
      category: 'algorithms',
      difficulty: 'medium',
      description: 'Description',
      starter_code: {},
      public_tests: [],
      hidden_tests: [],
    }));
    (prisma.codingProblem.findMany as vi.Mock).mockResolvedValue(largePool);
    (shuffleInPlace as vi.Mock).mockReturnValue([largePool[0]]);

    await selectCodingProblem({ difficulty: 'medium' });

    expect(prisma.codingProblem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });

  it('handles problems with no public or hidden tests', async () => {
    const problemNoTests = {
      ...mockProblem,
      public_tests: [],
      hidden_tests: [],
    };
    (prisma.codingProblem.findMany as vi.Mock).mockResolvedValue([problemNoTests]);
    (shuffleInPlace as vi.Mock).mockReturnValue([problemNoTests]);

    const result = await selectCodingProblem({});

    expect(result.testCases).toHaveLength(0);
  });

  it('handles problems with missing starter_code gracefully (defaults to {})', async () => {
    const problemNoStarter = {
      ...mockProblem,
      starter_code: null as any,
    };
    (prisma.codingProblem.findMany as vi.Mock).mockResolvedValue([problemNoStarter]);
    (shuffleInPlace as vi.Mock).mockReturnValue([problemNoStarter]);

    const result = await selectCodingProblem({});

    expect(result.starterCode).toEqual({});
  });

  it('validates selected problem shape includes all required fields', async () => {
    (prisma.codingProblem.findMany as vi.Mock).mockResolvedValue([mockProblem]);
    (shuffleInPlace as vi.Mock).mockReturnValue([mockProblem]);

    const result = await selectCodingProblem({});

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('slug');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('testCases');
    expect(result).toHaveProperty('expectedComplexity');
    expect(result.expectedComplexity).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Code execution
// ---------------------------------------------------------------------------

describe('Code Executor — executeCodingSubmission', () => {
  it('returns summary with pass/fail for valid JavaScript submission', async () => {
    const code = `
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement), i];
    seen.set(nums[i], i);
  }
  return [];
}
`;
    const testCases: any[] = [
      { name: 'Case 1', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { name: 'Case 2', args: [[3, 2, 4], 6], expected: [1, 2] },
    ];

    const result = await executeCodingSubmission(code, 'javascript', testCases, 'twoSum');

    expect(result.allPassed).toBe(true);
    expect(result.passRate).toBe(1);
    expect(result.passRateRatio).toBe(1);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].passed).toBe(true);
    expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.runnerVersion).toBeDefined();
  });

  it('returns partial pass when some tests fail', async () => {
    const code = `function twoSum(nums, target) { return []; }`;
    const testCases: any[] = [
      { name: 'Pass Case', args: [[2, 7], 9], expected: [0, 1] },
      { name: 'Fail Case', args: [[1, 2], 3], expected: [0, 1] }, // wrong output
    ];

    const result = await executeCodingSubmission(code, 'javascript', testCases, 'twoSum');

    expect(result.allPassed).toBe(false);
    expect(result.passRate).toBe(0.5);
    expect(result.passRateRatio).toBe(0.5);
  });

  it('handles empty test suite', async () => {
    const code = `const x = 1;`;
    const testCases: any[] = [];

    const result = await executeCodingSubmission(code, 'javascript', testCases, 'solution');

    expect(result.allPassed).toBe(true); // vacuously true
    expect(result.passRate).toBe(1);
    expect(result.results).toHaveLength(0);
  });

  it('handles runtime errors gracefully', async () => {
    const code = `function twoSum() { throw new Error('test error'); }`;
    const testCases: any[] = [
      { name: 'Error Case', args: [[1]], expected: [0] },
    ];

    // The executor catches errors and reports them
    const result = await executeCodingSubmission(code, 'javascript', testCases, 'twoSum');

    expect(result.results).toHaveLength(1);
    expect(result.results[0].passed).toBe(false);
    expect(result.results[0].error).toBeDefined();
  });

  it('supports Python submissions', async () => {
    const code = `
def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        complement = target - n
        if complement in seen:
            return [seen[complement], i]
        seen[n] = i
    return []
`;
    const testCases: any[] = [
      { name: 'Python Case', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
    ];

    const result = await executeCodingSubmission(code, 'python', testCases, 'two_sum');

    expect(result.results).toHaveLength(1);
    expect(result.results[0].passed).toBe(true);
  });

  it('handles timeout on infinite loop', async () => {
    const code = `function twoSum() { while (true) {} }`;
    const testCases: any[] = [
      { name: 'Timeout Case', args: [], expected: [] },
    ];

    const result = await executeCodingSubmission(code, 'javascript', testCases, 'twoSum');

    // Should not hang; should return with a timed-out or errored result
    expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('handles invalid language gracefully', async () => {
    const code = 'invalid code';
    const testCases: any[] = [];

    // Should not throw — returns a failed summary
    const result = await executeCodingSubmission(code, 'rust', testCases, 'fn');

    expect(result.allPassed).toBe(false);
    expect(result.passRate).toBe(0);
  });

  it('handles empty code submission', async () => {
    const code = '';
    const testCases: any[] = [
      { name: 'Empty Code', args: [[1, 2], 3], expected: [0, 1] },
    ];

    const result = await executeCodingSubmission(code, 'javascript', testCases, 'twoSum');

    expect(result.results).toHaveLength(1);
    expect(result.results[0].passed).toBe(false);
  });

  it('handles null/undefined code gracefully', async () => {
    const testCases: any[] = [];

    // Should not throw on null code
    const result = await executeCodingSubmission(null as any, 'javascript', testCases, 'fn');

    expect(result.allPassed).toBe(true); // vacuous
    expect(result.passRate).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Code compiled — checkCompleteness and generateCodingSubmissionSummary
// ---------------------------------------------------------------------------

describe('Code Compiled — checkCompleteness', () => {
  it('returns true for complete submission', () => {
    const code = 'function solve() { return 42; }';
    expect(checkCompleteness('javascript', code, 10)).toBe(true);
  });

  it('returns false for empty code', () => {
    expect(checkCompleteness('javascript', '', 10)).toBe(false);
  });

  it('returns false for whitespace-only code', () => {
    expect(checkCompleteness('javascript', '   \n\t  ', 10)).toBe(false);
  });

  it('returns false when code is below minimum length', () => {
    expect(checkCompleteness('javascript', 'x', 10)).toBe(false);
  });

  it('returns true when code meets minimum length', () => {
    expect(checkCompleteness('javascript', 'x'.repeat(10), 10)).toBe(true);
  });

  it('handles TypeScript the same as JavaScript', () => {
    const tsCode = 'type T = string;\nconst x: T = "hello";';
    expect(checkCompleteness('typescript', tsCode, 10)).toBe(true);
  });

  it('handles Python submissions', () => {
    const pyCode = 'def solve():\n    return 42\n';
    expect(checkCompleteness('python', pyCode, 10)).toBe(true);
  });

  it('handles Go submissions', () => {
    const goCode = 'package main\nfunc main() {}\n';
    expect(checkCompleteness('go', goCode, 10)).toBe(true);
  });
});

describe('Code Compiled — generateCodingSubmissionSummary', () => {
  it('generates summary from test results', () => {
    const results = [
      { name: 'Test 1', passed: true, output: '[0, 1]', expected: '[0, 1]', error: null, durationMs: 5 },
      { name: 'Test 2', passed: true, output: '[1, 2]', expected: '[1, 2]', error: null, durationMs: 3 },
      { name: 'Test 3', passed: false, output: '[]', expected: '[0, 1]', error: null, durationMs: 2 },
    ];

    const summary = generateCodingSubmissionSummary(results, 100, 64);

    expect(summary.allPassed).toBe(false);
    expect(summary.passRate).toBe(2 / 3);
    expect(summary.passRateRatio).toBe(2 / 3);
    expect(summary.totalTimeMs).toBeGreaterThanOrEqual(0);
    expect(summary.memoryKb).toBe(64);
    expect(summary.results).toHaveLength(3);
    expect(summary.runnerVersion).toBeDefined();
    expect(summary.logs).toBeDefined();
  });

  it('generates all-pass summary', () => {
    const results = [
      { name: 'A', passed: true, output: '1', expected: '1', error: null, durationMs: 1 },
      { name: 'B', passed: true, output: '2', expected: '2', error: null, durationMs: 1 },
    ];

    const summary = generateCodingSubmissionSummary(results, 50, 32);

    expect(summary.allPassed).toBe(true);
    expect(summary.passRate).toBe(1);
    expect(summary.passRateRatio).toBe(1);
  });

  it('handles empty results array', () => {
    const summary = generateCodingSubmissionSummary([], 0, 0);

    expect(summary.allPassed).toBe(true);
    expect(summary.passRate).toBe(1);
    expect(summary.passRateRatio).toBe(1);
    expect(summary.results).toHaveLength(0);
  });

  it('captures logs output', () => {
    const results: any[] = [];
    const logs = ['Compilation started', 'Running tests...', 'Done'];

    const summary = generateCodingSubmissionSummary(results, 10, 16, logs);

    expect(summary.logs).toEqual(logs);
  });
});

// ---------------------------------------------------------------------------
// Submission queue service
// ---------------------------------------------------------------------------

import { enqueueSubmissionExecution, processSubmissionJob } from '../services/submission/submission-queue.service';
import crypto from 'crypto';

describe('Submission Queue — enqueueSubmissionExecution', () => {
  it('creates submission with idempotency key', async () => {
    const idempotencyKey = `test_${crypto.randomUUID()}`;
    (prisma.codingSubmission.findUnique as vi.Mock).mockResolvedValue(null);
    (prisma.codingSubmission.count as vi.Mock).mockResolvedValue(0);
    (prisma.$transaction as vi.Mock).mockImplementation(async (fn) => {
      return (fn as Function)();
    });

    const result = await enqueueSubmissionExecution({
      applicationId: 'app-sub-001',
      problemId: 'prob-001',
      code: 'function solve() {}',
      language: 'javascript',
      idempotencyKey,
    });

    expect(result.idempotency_key).toBe(idempotencyKey);
    expect(result.code_hash).toBeDefined();
    expect(result.language).toBe('javascript');
    expect(result.status).toBe('queued');
    expect(result.attempt_number).toBe(1);
  });

  it('returns existing submission when idempotency key matches', async () => {
    const existing = {
      id: 'existing-sub',
      idempotency_key: 'existing-key',
      status: 'passed',
    };
    (prisma.codingSubmission.findUnique as vi.Mock).mockResolvedValue(existing);

    const result = await enqueueSubmissionExecution({
      applicationId: 'app-sub-002',
      code: 'different code',
      language: 'javascript',
      idempotencyKey: 'existing-key',
    });

    expect(result.id).toBe('existing-sub');
    // count and transaction should not be called
    expect(prisma.codingSubmission.count).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('de-duplicates identical code submissions with the same key', async () => {
    // Same idempotency key = same submission returned
    (prisma.codingSubmission.findUnique as vi.Mock).mockResolvedValue({
      id: 'dedup-sub',
      idempotency_key: 'same-key',
      code_hash: crypto.createHash('sha256').update('same code').digest('hex'),
      status: 'queued',
    });

    const result = await enqueueSubmissionExecution({
      applicationId: 'app-sub-003',
      code: 'same code',
      language: 'javascript',
      idempotencyKey: 'same-key',
    });

    expect(result.id).toBe('dedup-sub');
  });
});

describe('Submission Queue — processSubmissionJob', () => {
  it('updates submission status to running and processes test cases', async () => {
    const submission = {
      id: 'sub-process-001',
      application_id: 'app-proc-001',
      problem_id: 'prob-process',
      code: 'function solve(x) { return x * 2; }',
      language: 'javascript',
      status: 'queued',
      problem: {
        entry_point: 'solve',
        public_tests: [{ name: 'Double 5', args: [[5]], expected: [10] }],
        hidden_tests: [{ name: 'Double 0', args: [[0]], expected: [0] }],
      },
    };

    (prisma.codingSubmission.update as vi.Mock).mockResolvedValue({
      ...submission,
      status: 'running',
    });
    (prisma.codingSubmission.findUnique as vi.Mock).mockResolvedValue(submission);
    (prisma.codingSubmission.update as vi.Mock).mockResolvedValue({
      ...submission,
      status: 'passed',
      test_results: [{ name: 'Double 5', passed: true }],
      pass_rate: 1,
      pass_rate_percent: 1,
      pass_rate_ratio: 1,
      execution_time_ms: 15,
      memory_kb: 32,
      runner_version: '1.0.0',
      stdout_stderr: 'Test passed',
    });

    const result = await processSubmissionJob('sub-process-001');

    expect(result.status).toBe('passed');
    expect(result.pass_rate).toBe(1);
  });

  it('uses default test cases when problem has no tests', async () => {
    const submission = {
      id: 'sub-default',
      application_id: 'app-default',
      problem_id: null,
      code: 'function solve() { return 0; }',
      language: 'javascript',
      status: 'queued',
      problem: null,
    };

    (prisma.codingSubmission.update as vi.Mock).mockResolvedValue({
      ...submission,
      status: 'running',
    });
    (prisma.codingSubmission.findUnique as vi.Mock).mockResolvedValue(submission);

    const result = await processSubmissionJob('sub-default');

    expect(result).toBeDefined();
  });

  it('throws when submission not found', async () => {
    (prisma.codingSubmission.update as vi.Mock).mockResolvedValue({
      id: 'ghost-sub',
      status: 'running',
    });
    (prisma.codingSubmission.findUnique as vi.Mock).mockResolvedValue(null);

    await expect(processSubmissionJob('ghost-sub')).rejects.toThrow(
      'Submission ghost-sub not found in database'
    );
  });
});
